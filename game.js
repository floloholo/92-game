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
    
    socket.on('timerStarted', (data) => {
        gameState = data;
        startDiscussionTimer();
    });
    
    socket.on('phaseChanged', (data) => {
        if (data.phase === 'voting') {
            startVoting();
        } else if (data.phase === 'emergency') {
            startEmergencyVoting(data.nonVoters);
        }
    });
    
    socket.on('voteUpdate', (data) => {
        updateVoteDisplay(data.voterId, data.targetId);
    });
    
    socket.on('votingComplete', (data) => {
        showVotingResults(data);
    });
    
    socket.on('newRound', (data) => {
        gameState = data;
        startRound();
    });
    
    socket.on('gameAborted', (data) => {
        showGameAborted(data);
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
    
    // Show start timer button for host
    if (gameState.phase === 'readyToStart') {
        document.getElementById('phase').textContent = 'Ready to Start';
        document.getElementById('timer').textContent = `${Math.floor(gameState.discussionTime / 60)}:00`;
        
        // Show start button for host
        if (playerId === gameState.hostId) {
            const votingSection = document.getElementById('votingSection');
            votingSection.style.display = 'block';
            votingSection.innerHTML = `
                <h3>Round ${gameState.currentRound}</h3>
                <button class="primary-btn" onclick="startTimerHost()">Start Timer</button>
            `;
        }
    }
}

function startTimerHost() {
    socket.emit('startTimer');
    document.getElementById('votingSection').style.display = 'none';
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

function startDiscussionTimer() {
    clearInterval(timerInterval);
    let timeLeft = gameState.discussionTime;
    
    document.getElementById('phase').textContent = 'Discussion';
    document.getElementById('timer').style.color = ''; // Reset color
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            socket.emit('phaseEnd', { phase: 'discussion' });
        }
    }, 1000);
}

function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timer').textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function startVoting() {
    clearInterval(timerInterval);
    document.getElementById('phase').textContent = 'Voting';
    document.getElementById('timer').style.color = ''; // Reset color
    document.getElementById('votingSection').style.display = 'block';
    
    const votingSection = document.getElementById('votingSection');
    const votingPrompt = gameState.currentRound === 1 ? 'Click to vote someone out:' : 'Click who has the money:';
    
    votingSection.innerHTML = `
        <h3 id="votingPrompt">${votingPrompt}</h3>
        <div class="voting-buttons" id="votingButtons"></div>
    `;
    
    const votingButtons = document.getElementById('votingButtons');
    votedFor = null;
    
    // Create voting buttons
    gameState.players.forEach(player => {
        if (player.id !== playerId) {
            // Check if can vote for this player
            if (gameState.currentRound === 1 && gameState.eliminatedPlayers.includes(player.id)) {
                return; // Can't vote for eliminated players in round 1
            }
            
            const btn = document.createElement('div');
            btn.className = 'player-vote-card';
            btn.innerHTML = `
                <div class="player-avatar">👤</div>
                <div class="player-name">${player.name}</div>
                ${gameState.eliminatedPlayers.includes(player.id) ? '<div class="player-status">Eliminated</div>' : ''}
            `;
            btn.onclick = () => toggleVote(player.id);
            btn.setAttribute('data-player-id', player.id);
            votingButtons.appendChild(btn);
        }
    });
    
    // Start voting timer
    let votingTime = 30;
    timerInterval = setInterval(() => {
        votingTime--;
        updateTimerDisplay(votingTime);
        
        if (votingTime <= 0) {
            clearInterval(timerInterval);
            socket.emit('phaseEnd', { phase: 'voting' });
        }
    }, 1000);
}

function toggleVote(targetId) {
    if (votedFor === targetId) {
        // Deselect
        votedFor = null;
        socket.emit('vote', { targetId: null });
    } else {
        // Select new
        votedFor = targetId;
        socket.emit('vote', { targetId });
    }
    
    // Update UI
    document.querySelectorAll('.player-vote-card').forEach(card => {
        card.classList.remove('selected');
        if (card.getAttribute('data-player-id') === votedFor) {
            card.classList.add('selected');
        }
    });
}

function startEmergencyVoting(nonVoters) {
    clearInterval(timerInterval);
    document.getElementById('phase').textContent = 'EMERGENCY VOTING!';
    
    // Show warning for non-voters
    const votingSection = document.getElementById('votingSection');
    const warningDiv = document.createElement('div');
    warningDiv.className = 'emergency-warning';
    warningDiv.innerHTML = '<p>⚠️ VOTE NOW OR BE ELIMINATED! ⚠️</p>';
    votingSection.insertBefore(warningDiv, votingSection.firstChild);
    
    // Highlight non-voters
    if (nonVoters.includes(playerId)) {
        document.getElementById('timer').style.color = 'var(--danger-color)';
    }
    
    // Emergency timer
    let emergencyTime = 10;
    timerInterval = setInterval(() => {
        emergencyTime--;
        updateTimerDisplay(emergencyTime);
        
        if (emergencyTime <= 0) {
            clearInterval(timerInterval);
            socket.emit('phaseEnd', { phase: 'emergency' });
        }
    }, 1000);
}

function updateVoteDisplay(voterId, targetId) {
    // This can be used to show live voting updates if desired
}

function showVotingResults(data) {
    clearInterval(timerInterval);
    document.getElementById('votingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';
    
    const resultsDiv = document.getElementById('roundResults');
    resultsDiv.innerHTML = '<h3>Voting Results</h3>';
    
    // Show who voted for whom with pointing emojis
    const voteDisplay = document.createElement('div');
    voteDisplay.className = 'voting-display';
    
    Object.entries(data.votingResults).forEach(([voterId, targetId]) => {
        const voter = gameState.players.find(p => p.id === voterId);
        const target = gameState.players.find(p => p.id === targetId);
        
        const voteItem = document.createElement('div');
        voteItem.className = 'vote-item';
        voteItem.innerHTML = `${voter.name} 👉 ${target.name}`;
        voteDisplay.appendChild(voteItem);
    });
    
    resultsDiv.appendChild(voteDisplay);
    
    if (data.eliminated) {
        // Round 1 - show who was eliminated
        const eliminatedPlayer = gameState.players.find(p => p.id === data.eliminated);
        resultsDiv.innerHTML += `<p class="elimination-text"><strong>${eliminatedPlayer.name}</strong> was voted out!</p>`;
        
        // Update game state
        if (!gameState.eliminatedPlayers.includes(data.eliminated)) {
            gameState.eliminatedPlayers.push(data.eliminated);
        }
        updatePlayersGrid();
        
        // Show next round button after delay
        setTimeout(() => {
            resultsDiv.innerHTML += '<p>Round 2 starting soon...</p>';
        }, 3000);
    } else if (data.moneyHolder) {
        // Round 2 - show who had the money
        const moneyPlayer = gameState.players.find(p => p.id === data.moneyHolder);
        resultsDiv.innerHTML += `<p class="money-reveal">The money was with <strong>${moneyPlayer.name}</strong>! 💰</p>`;
        
        // Update scores
        gameState.scores = data.scores;
        updateScoreboard();
        
        // Show points earned
        resultsDiv.innerHTML += '<div class="points-earned"><h4>Points this round:</h4>';
        gameState.players.forEach(player => {
            const pointsEarned = (data.scores[player.id] || 0) - (gameState.previousScores?.[player.id] || 0);
            if (pointsEarned > 0) {
                resultsDiv.innerHTML += `<p>${player.name}: +${pointsEarned} points</p>`;
            }
        });
        resultsDiv.innerHTML += '</div>';
        
        // Show next round button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'primary-btn';
        nextBtn.textContent = 'Next Round';
        nextBtn.onclick = nextRound;
        resultsDiv.appendChild(nextBtn);
    }
}

function showGameAborted(data) {
    clearInterval(timerInterval);
    document.getElementById('votingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';
    
    const resultsDiv = document.getElementById('roundResults');
    resultsDiv.innerHTML = `<h3>Game Ended</h3><p class="abort-reason">${data.reason}</p>`;
    
    if (data.winner) {
        const winner = gameState.players.find(p => p.id === data.winner);
        resultsDiv.innerHTML += `<p class="winner-text"><strong>${winner.name}</strong> wins by default! 🏆</p>`;
    }
    
    if (data.eliminated) {
        resultsDiv.innerHTML += '<p>The following players were eliminated for not voting:</p><ul>';
        data.eliminated.forEach(id => {
            const player = gameState.players.find(p => p.id === id);
            resultsDiv.innerHTML += `<li>${player.name}</li>`;
        });
        resultsDiv.innerHTML += '</ul>';
    }
    
    // Back to lobby button
    const backBtn = document.createElement('button');
    backBtn.className = 'primary-btn';
    backBtn.textContent = 'Back to Lobby';
    backBtn.onclick = () => socket.emit('backToLobby');
    resultsDiv.appendChild(backBtn);
}

function nextRound() {
    socket.emit('nextRound');
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