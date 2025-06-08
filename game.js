// Game state
let socket;
let currentRoom = null;
let playerName = '';
let playerId = null;
let gameState = null;
let votedFor = null;
let timerInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if returning player
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        document.getElementById('playerName').value = savedName;
    }
    
    // Check for room code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
        document.getElementById('roomCode').value = roomFromUrl.toUpperCase();
    }
    
    // Show video check modal
    document.getElementById('videoCheckModal').style.display = 'block';
});

// Video check confirmation
function confirmVideoReady() {
    document.getElementById('videoCheckModal').style.display = 'none';
    connectToServer();
}

// Connect to server
function connectToServer() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        playerId = socket.id;
    });
    
    socket.on('roomCreated', (data) => {
        currentRoom = data.roomCode;
        showLobby();
        updateLobby(data);
    });
    
    socket.on('joinedRoom', (data) => {
        currentRoom = data.roomCode;
        showLobby();
        updateLobby(data);
    });
    
    socket.on('playerJoined', (data) => {
        updateLobby(data);
    });
    
    socket.on('playerLeft', (data) => {
        updateLobby(data);
    });
    
    socket.on('gameStarted', (data) => {
        gameState = data;
        showGameScreen();
        startRound();
    });
    
    socket.on('voteReceived', (data) => {
        gameState = data;
        updateVotingUI();
    });
    
    socket.on('roundEnded', (data) => {
        gameState = data;
        showRoundResults();
    });
    
    socket.on('gameEnded', (data) => {
        showFinalResults(data);
    });
    
    socket.on('error', (error) => {
        alert(error.message);
    });
}

// Room management
function createRoom() {
    playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    
    localStorage.setItem('playerName', playerName);
    socket.emit('createRoom', { playerName });
}

function joinRoom() {
    playerName = document.getElementById('playerName').value.trim();
    const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
    
    if (!playerName || !roomCode) {
        alert('Please enter your name and room code');
        return;
    }
    
    localStorage.setItem('playerName', playerName);
    socket.emit('joinRoom', { playerName, roomCode });
}

function leaveRoom() {
    socket.emit('leaveRoom');
    currentRoom = null;
    showMainMenu();
}

function copyRoomCode() {
    navigator.clipboard.writeText(currentRoom);
    const btns = document.querySelectorAll('.lobby-header .copy-btn');
    btns[0].textContent = 'Copied!';
    setTimeout(() => {
        btns[0].textContent = 'Copy Code';
    }, 2000);
}

function copyShareLink() {
    const shareLink = document.getElementById('shareLink').value;
    navigator.clipboard.writeText(shareLink);
    const btns = document.querySelectorAll('.share-link-container .copy-btn');
    btns[0].textContent = 'Copied!';
    setTimeout(() => {
        btns[0].textContent = 'Copy Link';
    }, 2000);
}

// UI Navigation
function showMainMenu() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById('mainMenu').style.display = 'block';
}

function showLobby() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById('lobby').style.display = 'block';
    document.getElementById('lobbyRoomCode').textContent = currentRoom;
    
    // Generate and display share link
    const shareLink = `${window.location.origin}${window.location.pathname}?room=${currentRoom}`;
    document.getElementById('shareLink').value = shareLink;
}

function showGameScreen() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('gameRoomCode').textContent = currentRoom;
}

// Lobby updates
function updateLobby(data) {
    const playersList = document.getElementById('playersList');
    const playerCount = document.getElementById('playerCount');
    const startBtn = document.getElementById('startGameBtn');
    
    playersList.innerHTML = '';
    data.players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player.name;
        if (player.id === data.hostId) {
            li.textContent += ' (Host)';
        }
        playersList.appendChild(li);
    });
    
    playerCount.textContent = data.players.length;
    
    // Enable start button for host if enough players
    if (playerId === data.hostId && data.players.length >= 3) {
        startBtn.disabled = false;
        startBtn.textContent = 'Start Game';
    } else if (data.players.length < 3) {
        startBtn.disabled = true;
        startBtn.textContent = 'Need at least 3 players';
    } else {
        startBtn.disabled = true;
        startBtn.textContent = 'Waiting for host to start';
    }
}

// Game functions
function startGame() {
    socket.emit('startGame');
}

function startRound() {
    // Update briefcase status
    const statusText = document.getElementById('statusText');
    const briefcaseIcon = document.querySelector('.briefcase-icon');
    
    if (gameState.moneyHolder === playerId) {
        statusText.textContent = 'Your briefcase has the MONEY!';
        statusText.style.color = 'var(--success-color)';
        briefcaseIcon.textContent = '💰';
    } else {
        statusText.textContent = 'Your briefcase is EMPTY';
        statusText.style.color = 'var(--danger-color)';
        briefcaseIcon.textContent = '💼';
    }
    
    // Update players grid
    updatePlayersGrid();
    
    // Update scores
    updateScoreboard();
    
    // Hide voting section initially
    document.getElementById('votingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    // Start timer
    startTimer();
}

function updatePlayersGrid() {
    const grid = document.getElementById('playersGrid');
    grid.innerHTML = '';
    
    gameState.players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';
        if (gameState.eliminatedPlayers.includes(player.id)) {
            card.className += ' eliminated';
        }
        
        card.innerHTML = `
            <div class="player-avatar">👤</div>
            <div class="player-name">${player.name}</div>
            <div class="player-status">${gameState.eliminatedPlayers.includes(player.id) ? 'Eliminated' : 'Active'}</div>
        `;
        
        grid.appendChild(card);
    });
}

function startTimer() {
    clearInterval(timerInterval);
    let timeLeft = gameState.currentRound === 1 ? gameState.discussionTime : gameState.discussionTime;
    
    updateTimerDisplay(timeLeft);
    document.getElementById('phase').textContent = 'Discussion';
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (gameState.phase === 'discussion') {
                startVoting();
            }
        }
    }, 1000);
}

function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timer').textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function startVoting() {
    document.getElementById('phase').textContent = 'Voting';
    document.getElementById('votingSection').style.display = 'block';
    
    const votingButtons = document.getElementById('votingButtons');
    const votingPrompt = document.getElementById('votingPrompt');
    
    votingButtons.innerHTML = '';
    votedFor = null;
    
    if (gameState.currentRound === 1) {
        votingPrompt.textContent = 'Vote to kick out:';
        
        // Show active players to vote for (except yourself)
        gameState.players.forEach(player => {
            if (player.id !== playerId && !gameState.eliminatedPlayers.includes(player.id)) {
                const btn = document.createElement('button');
                btn.className = 'vote-btn';
                btn.textContent = player.name;
                btn.onclick = () => vote(player.id);
                votingButtons.appendChild(btn);
            }
        });
    } else {
        votingPrompt.textContent = 'Who has the money?';
        
        // Show all players except yourself (can vote for eliminated player)
        gameState.players.forEach(player => {
            if (player.id !== playerId) {
                const btn = document.createElement('button');
                btn.className = 'vote-btn';
                btn.textContent = player.name;
                if (gameState.eliminatedPlayers.includes(player.id)) {
                    btn.textContent += ' (Eliminated)';
                }
                btn.onclick = () => vote(player.id);
                votingButtons.appendChild(btn);
            }
        });
    }
    
    // Start voting timer
    let votingTime = gameState.votingTime;
    timerInterval = setInterval(() => {
        votingTime--;
        updateTimerDisplay(votingTime);
        
        if (votingTime <= 0) {
            clearInterval(timerInterval);
            // Auto-submit if not voted
            if (!votedFor) {
                // Random vote
                const buttons = document.querySelectorAll('.vote-btn');
                if (buttons.length > 0) {
                    buttons[0].click();
                }
            }
        }
    }, 1000);
}

function vote(targetId) {
    if (votedFor) return;
    
    votedFor = targetId;
    socket.emit('vote', { targetId });
    
    // Update UI
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.classList.remove('voted');
        if (btn.textContent.includes(gameState.players.find(p => p.id === targetId).name)) {
            btn.classList.add('voted');
        }
    });
}

function updateVotingUI() {
    // Update any voting-related UI if needed
}

function showRoundResults() {
    clearInterval(timerInterval);
    document.getElementById('votingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';
    
    const resultsDiv = document.getElementById('roundResults');
    resultsDiv.innerHTML = '';
    
    if (gameState.phase === 'roundEnd') {
        // Show who was eliminated
        const eliminated = gameState.lastEliminated;
        if (eliminated) {
            const eliminatedPlayer = gameState.players.find(p => p.id === eliminated);
            resultsDiv.innerHTML += `<p><strong>${eliminatedPlayer.name}</strong> was voted out!</p>`;
        }
        
        updatePlayersGrid();
    } else if (gameState.phase === 'gameEnd') {
        // Show final results
        const moneyPlayer = gameState.players.find(p => p.id === gameState.moneyHolder);
        resultsDiv.innerHTML += `<p>The money was with <strong>${moneyPlayer.name}</strong>!</p>`;
        
        // Show points earned
        resultsDiv.innerHTML += '<p>Points this round:</p>';
        gameState.players.forEach(player => {
            const pointsEarned = gameState.scores[player.id] - (gameState.previousScores?.[player.id] || 0);
            if (pointsEarned > 0) {
                resultsDiv.innerHTML += `<p>${player.name}: +${pointsEarned} points</p>`;
            }
        });
    }
    
    updateScoreboard();
}

function updateScoreboard() {
    const scoresList = document.getElementById('scoresList');
    scoresList.innerHTML = '';
    
    // Sort players by score
    const sortedPlayers = [...gameState.players].sort((a, b) => 
        (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0)
    );
    
    sortedPlayers.forEach((player, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        if (index === 0 && gameState.scores[player.id] > 0) {
            scoreItem.className += ' leader';
        }
        
        scoreItem.innerHTML = `
            <span>${player.name}</span>
            <span>${gameState.scores[player.id] || 0} points</span>
        `;
        
        scoresList.appendChild(scoreItem);
    });
}

function nextRound() {
    socket.emit('nextRound');
}

function showFinalResults(data) {
    // Show final game results
    const resultsDiv = document.getElementById('roundResults');
    resultsDiv.innerHTML = '<h2>Game Over!</h2>';
    
    const winner = data.players.reduce((prev, current) => 
        (data.scores[current.id] || 0) > (data.scores[prev.id] || 0) ? current : prev
    );
    
    resultsDiv.innerHTML += `<p>Winner: <strong>${winner.name}</strong> with ${data.scores[winner.id]} points!</p>`;
    
    document.querySelector('#resultsSection button').textContent = 'Back to Lobby';
    document.querySelector('#resultsSection button').onclick = () => {
        socket.emit('backToLobby');
    };
}