# Troubleshooting Guide

## Common Issues and Solutions

### 1. Port 3000 Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:

#### Option A: Use the restart script (Recommended)
```bash
./restart.sh
```
This will automatically stop any process using port 3000 and start the game.

#### Option B: Manually kill the process
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process (replace PID with the actual number)
kill -9 PID

# Start the game
npm start
```

#### Option C: Use a different port
Edit `server.js` and change the port:
```javascript
const PORT = process.env.PORT || 3001;  // Changed from 3000 to 3001
```

### 2. Cannot Find Module Errors

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules
npm install
```

### 3. Socket.io Connection Issues

**Common Causes**:
- Firewall blocking connections
- Browser extensions interfering
- Incorrect room code

**Solutions**:
- Try incognito/private browsing mode
- Disable ad blockers temporarily
- Ensure all players are on the same network

### 4. Game Not Loading

**Check**:
1. Is the server running? (You should see "Server running on port 3000")
2. Are you accessing the correct URL? (http://localhost:3000)
3. Try a different browser

### 5. Video Chat Issues

**Remember**: The game doesn't include video chat - use:
- Zoom
- Google Meet
- Discord
- FaceTime
- Any other video service

### Quick Commands

```bash
# Start normally
npm start

# Start with automatic port cleanup
./restart.sh

# Start with full setup check
./start.sh

# Check if server is running
ps aux | grep node

# Check what's on port 3000
lsof -i :3000

# Kill all node processes (nuclear option)
killall node
```

### Still Having Issues?

1. Check the browser console for errors (F12)
2. Check the server terminal for error messages
3. Make sure you have Node.js v14+ installed
4. Try restarting your computer (classic solution!)

Happy gaming! 🎮