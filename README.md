# 92 - The Money Game

A fun online social deduction game where players try to figure out who has the money!

## Features

- Real-time multiplayer gameplay using Socket.io
- Room-based system with 4-letter room codes
- Clean, modern UI that works alongside video chat
- Scoring system with multiple game modes
- Mobile-responsive design
- Ready for ad integration

## How to Play

1. **Setup**: 3+ players join a room using a 4-letter code
2. **Round 1**: One player secretly has the money. Players discuss for 2 minutes, then vote someone out
3. **Round 2**: Remaining players discuss again and vote on who they think has the money
4. **Scoring**:
   - Both guess correctly: 1 point each
   - One guesses correctly: 3 points
   - Nobody guesses correctly: Money holder gets 3 points

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser

## Development

For development with auto-restart:
```bash
npm run dev
```

## Video Chat Integration

The game is designed to be played alongside a video chat service. Players should:
1. Set up a video call using Zoom, Google Meet, Discord, etc.
2. Share the room code with other players
3. Play the game while seeing each other on video

## Ad Integration

The game includes placeholder ad containers at the top and bottom of the page. To monetize:

1. **Google AdSense**:
   - Sign up for Google AdSense
   - Replace the `.ad-placeholder` divs with your AdSense code
   - Example:
   ```html
   <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-YOUR-ID"
        data-ad-slot="YOUR-SLOT"
        data-ad-format="auto"></ins>
   <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
   ```

2. **Other Ad Networks**:
   - Media.net
   - Amazon Publisher Services
   - Ezoic
   - PropellerAds

3. **Ad Placement Tips**:
   - Keep ads non-intrusive
   - Use responsive ad units
   - Consider removing bottom ad on mobile for better UX

## Deployment

### Heroku
1. Create a new Heroku app
2. Add this buildpack: `heroku/nodejs`
3. Deploy:
   ```bash
   git push heroku main
   ```

### Railway
1. Connect your GitHub repo to Railway
2. Add environment variable `PORT` if needed
3. Deploy automatically on push

### Render
1. Create a new Web Service
2. Connect your GitHub repo
3. Use `npm start` as the start command

## Game Modes

Currently supports:
- First to X points
- Best of X rounds
- Most points after X rounds

## Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express
- **Real-time**: Socket.io
- **Styling**: Custom CSS with CSS variables

## Future Enhancements

- [ ] Spectator mode
- [ ] Custom avatars
- [ ] Sound effects
- [ ] Game history/stats
- [ ] Tournament mode
- [ ] Built-in video chat (WebRTC)
- [ ] More game variations

## License

MIT License - feel free to use this for your own projects!

## Credits

Created with ❤️ for fun online gaming sessions!