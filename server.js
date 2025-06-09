const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.static(__dirname));

// Game configuration
const GAME_CONFIG = {
    MIN_PLAYERS: 3,
    BASE_DISCUSSION_TIME: 120, // 2 minutes for 3 players
    ADDITIONAL_TIME_PER_PLAYER: 60, // 1 minute per extra player
    VOTING_TIME: 30,
    EMERGENCY_TIME: 10, // Emergency voting time
    POINTS: {
        BOTH_CORRECT: 1,
        SINGLE_CORRECT: 3,
        MONEY_HOLDER_WINS: 3
    }
};

// Game state storage
const rooms = new Map();
const playerRooms = new Map();

// Helper functions
function generateRoomCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += letters[Math.floor(Math.random() * letters.length)];
    }
    return code;
}

function getRoom(roomCode) {
    return rooms.get(roomCode);
}

function createRoom(hostId, hostName) {
    let roomCode;
    do {
        roomCode = generateRoomCode();
    } while (rooms.has(roomCode));
    
    const room = {
        code: roomCode,
        hostId: hostId,
        players: [{
            id: hostId,
            name: hostName,
            connected: true
        }],
        gameState: {
            status: 'lobby', // lobby, playing, finished
            currentRound: 0,
            phase: 'waiting', // waiting, readyToStart, discussion, voting, emergency, roundEnd, gameEnd
            moneyHolder: null,
            eliminatedPlayers: [],
            votes: {},
            scores: {},
            discussionTime: GAME_CONFIG.BASE_DISCUSSION_TIME,
            votingTime: GAME_CONFIG.VOTING_TIME,
            emergencyTime: GAME_CONFIG.EMERGENCY_TIME,
            lastEliminated: null,
            previousScores: {},
            nonVoters: [], // Players who didn't vote
            votingResults: {}, // Detailed voting results
            timerStarted: false
        }
    };
    
    rooms.set(roomCode, room);
    playerRooms.set(hostId, roomCode);
    return room;
}

function removePlayerFromRoom(playerId) {
    const roomCode = playerRooms.get(playerId);
    if (!roomCode) return null;
    
    const room = rooms.get(roomCode);
    if (!room) return null;
    
    room.players = room.players.filter(p => p.id !== playerId);
    playerRooms.delete(playerId);
    
    // If room is empty, delete it
    if (room.players.length === 0) {
        rooms.delete(roomCode);
        return null;
    }
    
    // If host left, assign new host
    if (room.hostId === playerId && room.players.length > 0) {
        room.hostId = room.players[0].id;
    }
    
    // If game is in progress and player left, mark as eliminated
    if (room.gameState.status === 'playing' && 
        !room.gameState.eliminatedPlayers.includes(playerId)) {
        room.gameState.eliminatedPlayers.push(playerId);
    }
    
    return room;
}

function startNewRound(room) {
    const gameState = room.gameState;
    gameState.currentRound++;
    gameState.phase = 'readyToStart'; // Wait for host to start timer
    gameState.votes = {};
    gameState.lastEliminated = null;
    gameState.nonVoters = [];
    gameState.votingResults = {};
    gameState.timerStarted = false;
    
    // Calculate discussion time based on player count
    const activePlayers = room.players.filter(p => 
        !gameState.eliminatedPlayers.includes(p.id)
    ).length;
    gameState.discussionTime = GAME_CONFIG.BASE_DISCUSSION_TIME + 
        Math.max(0, (room.players.length - 3) * GAME_CONFIG.ADDITIONAL_TIME_PER_PLAYER);
    
    // Randomly assign money holder
    const eligiblePlayers = room.players.filter(p => 
        !gameState.eliminatedPlayers.includes(p.id)
    );
    gameState.moneyHolder = eligiblePlayers[
        Math.floor(Math.random() * eligiblePlayers.length)
    ].id;
    
    // Store previous scores
    gameState.previousScores = { ...gameState.scores };
}

function calculateScores(room) {
    const gameState = room.gameState;
    const moneyHolder = gameState.moneyHolder;
    
    // Count votes for the money holder
    const votesForMoneyHolder = Object.values(gameState.votes).filter(
        vote => vote === moneyHolder
    ).length;
    
    const activeNonMoneyPlayers = room.players.filter(p => 
        !gameState.eliminatedPlayers.includes(p.id) && p.id !== moneyHolder
    );
    
    if (votesForMoneyHolder === activeNonMoneyPlayers.length) {
        // Everyone guessed correctly
        activeNonMoneyPlayers.forEach(player => {
            if (!gameState.scores[player.id]) gameState.scores[player.id] = 0;
            gameState.scores[player.id] += GAME_CONFIG.POINTS.BOTH_CORRECT;
        });
    } else if (votesForMoneyHolder > 0) {
        // Some guessed correctly
        Object.entries(gameState.votes).forEach(([voterId, votedFor]) => {
            if (votedFor === moneyHolder) {
                if (!gameState.scores[voterId]) gameState.scores[voterId] = 0;
                gameState.scores[voterId] += GAME_CONFIG.POINTS.SINGLE_CORRECT;
            }
        });
    } else {
        // Nobody guessed correctly
        if (!gameState.scores[moneyHolder]) gameState.scores[moneyHolder] = 0;
        gameState.scores[moneyHolder] += GAME_CONFIG.POINTS.MONEY_HOLDER_WINS;
    }
}

// Socket.io event handlers
io.on('connection', (socket) => {
    console.log('New connection:', socket.id);
    
    socket.on('createRoom', (data) => {
        const { playerName } = data;
        const room = createRoom(socket.id, playerName);
        
        socket.join(room.code);
        socket.emit('roomCreated', {
            roomCode: room.code,
            players: room.players,
            hostId: room.hostId
        });
    });
    
    socket.on('joinRoom', (data) => {
        const { playerName, roomCode } = data;
        const room = getRoom(roomCode);
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        
        if (room.gameState.status !== 'lobby') {
            socket.emit('error', { message: 'Game already in progress' });
            return;
        }
        
        // Add player to room
        room.players.push({
            id: socket.id,
            name: playerName,
            connected: true
        });
        playerRooms.set(socket.id, roomCode);
        
        socket.join(roomCode);
        
        // Notify all players
        io.to(roomCode).emit('playerJoined', {
            players: room.players,
            hostId: room.hostId
        });
        
        socket.emit('joinedRoom', {
            roomCode: room.code,
            players: room.players,
            hostId: room.hostId
        });
    });
    
    socket.on('leaveRoom', () => {
        const room = removePlayerFromRoom(socket.id);
        if (room) {
            socket.leave(room.code);
            io.to(room.code).emit('playerLeft', {
                players: room.players,
                hostId: room.hostId
            });
        }
    });
    
    socket.on('startGame', () => {
        const roomCode = playerRooms.get(socket.id);
        const room = getRoom(roomCode);
        
        if (!room || room.hostId !== socket.id) {
            socket.emit('error', { message: 'Only host can start the game' });
            return;
        }
        
        if (room.players.length < GAME_CONFIG.MIN_PLAYERS) {
            socket.emit('error', { message: 'Not enough players' });
            return;
        }
        
        // Initialize game
        room.gameState.status = 'playing';
        room.gameState.currentRound = 0;
        room.gameState.eliminatedPlayers = [];
        room.gameState.scores = {};
        room.players.forEach(p => {
            room.gameState.scores[p.id] = 0;
        });
        
        // Start first round
        startNewRound(room);
        
        // Include additional data in gameState for client
        const enrichedGameState = {
            ...room.gameState,
            players: room.players,
            hostId: room.hostId
        };
        
        io.to(roomCode).emit('gameStarted', enrichedGameState);
    });
    
    socket.on('vote', (data) => {
        const { targetId } = data;
        const roomCode = playerRooms.get(socket.id);
        const room = getRoom(roomCode);
        
        if (!room || room.gameState.status !== 'playing') return;
        if (room.gameState.eliminatedPlayers.includes(socket.id)) return;
        if (room.gameState.phase !== 'voting' && room.gameState.phase !== 'emergency') return;
        
        // If targetId is null, remove vote
        if (targetId === null) {
            delete room.gameState.votes[socket.id];
        } else {
            room.gameState.votes[socket.id] = targetId;
        }
        
        io.to(roomCode).emit('voteUpdate', {
            voterId: socket.id,
            targetId: targetId
        });
    });
    
    socket.on('startTimer', () => {
        const roomCode = playerRooms.get(socket.id);
        const room = getRoom(roomCode);
        
        if (!room || room.hostId !== socket.id) {
            socket.emit('error', { message: 'Only host can start the timer' });
            return;
        }
        
        if (room.gameState.phase !== 'readyToStart') return;
        
        room.gameState.phase = 'discussion';
        room.gameState.timerStarted = true;
        
        const enrichedGameState = {
            ...room.gameState,
            players: room.players,
            hostId: room.hostId
        };
        
        io.to(roomCode).emit('timerStarted', enrichedGameState);
    });
    
    socket.on('phaseEnd', (data) => {
        const { phase } = data;
        const roomCode = playerRooms.get(socket.id);
        const room = getRoom(roomCode);
        
        if (!room) return;
        
        if (phase === 'discussion') {
            // Move to voting phase
            room.gameState.phase = 'voting';
            room.gameState.votes = {};
            io.to(roomCode).emit('phaseChanged', { phase: 'voting', time: GAME_CONFIG.VOTING_TIME });
        } else if (phase === 'voting') {
            // Check who hasn't voted
            const activePlayers = room.players.filter(p => 
                !room.gameState.eliminatedPlayers.includes(p.id)
            );
            const nonVoters = activePlayers.filter(p => !room.gameState.votes[p.id]);
            
            if (nonVoters.length > 0) {
                // Move to emergency phase
                room.gameState.phase = 'emergency';
                room.gameState.nonVoters = nonVoters.map(p => p.id);
                io.to(roomCode).emit('phaseChanged', { 
                    phase: 'emergency', 
                    time: GAME_CONFIG.EMERGENCY_TIME,
                    nonVoters: room.gameState.nonVoters
                });
            } else {
                // Everyone voted, process results
                processVotingResults(room);
            }
        } else if (phase === 'emergency') {
            // Emergency time ended, handle non-voters
            handleNonVoters(room);
        }
    });
    
    function processVotingResults(room) {
        const gameState = room.gameState;
        
        // Store detailed voting results
        gameState.votingResults = { ...gameState.votes };
        
        if (gameState.currentRound === 1) {
            // First round - elimination vote
            const voteCounts = {};
            Object.values(gameState.votes).forEach(vote => {
                voteCounts[vote] = (voteCounts[vote] || 0) + 1;
            });
            
            // Find player with most votes (handle ties by random selection)
            let maxVotes = 0;
            let candidates = [];
            Object.entries(voteCounts).forEach(([playerId, count]) => {
                if (count > maxVotes) {
                    maxVotes = count;
                    candidates = [playerId];
                } else if (count === maxVotes) {
                    candidates.push(playerId);
                }
            });
            
            // Random selection from tied candidates
            const eliminated = candidates[Math.floor(Math.random() * candidates.length)];
            
            // Eliminate player
            gameState.eliminatedPlayers.push(eliminated);
            gameState.lastEliminated = eliminated;
            gameState.phase = 'roundEnd';
            
            io.to(room.code).emit('votingComplete', {
                votingResults: gameState.votingResults,
                eliminated: eliminated,
                voteCounts: voteCounts
            });
            
            // Auto-start round 2 after a delay
            setTimeout(() => {
                gameState.currentRound = 2;
                gameState.votes = {};
                gameState.votingResults = {};
                gameState.phase = 'readyToStart';
                
                const enrichedGameState = {
                    ...gameState,
                    players: room.players,
                    hostId: room.hostId
                };
                
                io.to(room.code).emit('newRound', enrichedGameState);
            }, 7000);
        } else {
            // Second round - money guess vote
            calculateScores(room);
            gameState.phase = 'gameEnd';
            
            io.to(room.code).emit('votingComplete', {
                votingResults: gameState.votingResults,
                moneyHolder: gameState.moneyHolder,
                scores: gameState.scores
            });
        }
    }
    
    function handleNonVoters(room) {
        const gameState = room.gameState;
        const activePlayers = room.players.filter(p => 
            !gameState.eliminatedPlayers.includes(p.id)
        );
        const finalNonVoters = activePlayers.filter(p => !gameState.votes[p.id]);
        
        if (finalNonVoters.length === 0) {
            // Everyone voted during emergency
            processVotingResults(room);
        } else if (finalNonVoters.length === activePlayers.length) {
            // Nobody voted - restart game
            gameState.phase = 'gameEnd';
            io.to(room.code).emit('gameAborted', { reason: 'Nobody voted' });
        } else if (finalNonVoters.length === activePlayers.length - 1) {
            // Only one person voted - they win
            const voter = activePlayers.find(p => gameState.votes[p.id]);
            if (!gameState.scores[voter.id]) gameState.scores[voter.id] = 0;
            gameState.scores[voter.id] += 3;
            gameState.phase = 'gameEnd';
            io.to(room.code).emit('gameAborted', { 
                reason: 'Only one player voted',
                winner: voter.id
            });
        } else {
            // Multiple non-voters - eliminate them and end game
            finalNonVoters.forEach(player => {
                gameState.eliminatedPlayers.push(player.id);
            });
            gameState.phase = 'gameEnd';
            io.to(room.code).emit('gameAborted', { 
                reason: 'Multiple players did not vote',
                eliminated: finalNonVoters.map(p => p.id)
            });
        }
    }
    
    socket.on('nextRound', () => {
        const roomCode = playerRooms.get(socket.id);
        const room = getRoom(roomCode);
        
        if (!room) return;
        
        // Reset for new round
        room.gameState.eliminatedPlayers = [];
        room.gameState.votes = {};
        
        startNewRound(room);
        
        const enrichedGameState = {
            ...room.gameState,
            players: room.players,
            hostId: room.hostId
        };
        
        io.to(roomCode).emit('gameStarted', enrichedGameState);
    });
    
    socket.on('backToLobby', () => {
        const roomCode = playerRooms.get(socket.id);
        const room = getRoom(roomCode);
        
        if (!room) return;
        
        room.gameState.status = 'lobby';
        room.gameState.currentRound = 0;
        room.gameState.eliminatedPlayers = [];
        room.gameState.votes = {};
        
        io.to(roomCode).emit('playerJoined', {
            players: room.players,
            hostId: room.hostId
        });
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected:', socket.id);
        const room = removePlayerFromRoom(socket.id);
        if (room) {
            io.to(room.code).emit('playerLeft', {
                players: room.players,
                hostId: room.hostId
            });
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});