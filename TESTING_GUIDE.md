# Testing the Game Locally

## Quick Start

1. **Start the server:**
   ```bash
   cd /Users/Ali/Coding/92-game
   ./start.sh
   ```
   OR
   ```bash
   npm start
   ```

2. **Open multiple browser windows/tabs:**
   - Window 1 (Host): `http://localhost:3000`
   - Window 2 (Player 2): `http://localhost:3000`
   - Window 3 (Player 3): `http://localhost:3000`

## Testing Flow

### As the Host:
1. Enter your name (e.g., "Host")
2. Click "Create Room"
3. Share the 4-letter room code with others
4. OR copy the share link and send it to players

### As Other Players:
1. Enter your name (e.g., "Player 2", "Player 3")
2. Enter the room code OR use the share link
3. Click "Join Room"

### Starting the Game:
1. Host waits for at least 3 players
2. Host clicks "Start Game"
3. Each player sees if they have the money or not
4. Discuss for 2 minutes
5. Vote someone out
6. Discuss again and vote for who has the money
7. See results and play again!

## Testing Tips

- Use different browsers (Chrome, Firefox, Safari) or incognito windows to simulate different players
- You can test with just 3 tabs/windows on the same computer
- The game works best with actual video chat, but you can test without it
- Try different strategies: lying, truth-telling, deflection

## Common Issues

**"Room not found"**
- Make sure you typed the 4-letter code correctly (case doesn't matter)
- Ensure the host hasn't left the room

**Can't vote for yourself**
- This is intentional - you cannot vote to eliminate yourself or vote that you have the money

**Server not starting**
- Make sure no other process is using port 3000
- Try `killall node` then restart

## Local Network Play

To play with others on your local network:
1. Find your local IP address:
   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`
2. Share your IP with others: `http://YOUR_IP:3000`
3. Make sure you're all on the same WiFi network

Have fun playing 92! 🎮💰