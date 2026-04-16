# TikTok Shop Stars Awards Website

A modern awards showcase website for TikTok Shop employees.

## Features

- 🏆 **Global Top 10 Rankings** - Live leaderboard with podium display
- 🌎 **Regional Awards** - US, EU+UK+JP, SEA, LATAM
- 🏢 **Departmental Awards** - 33 departments coverage
- 🔍 **Global Search** - Search across all awards
- 📱 **Responsive Design** - Works on all devices

## Pages

1. **Home** - Global Top 10 + Overview stats
2. **Global** - All global level awards
3. **Regional** - Regional awards by area (US, EU+UK+JP, SEA, LATAM)
4. **Departmental** - Department-level awards
5. **Award Structure & Timeline** - Award structure information
6. **Media Gallery** - Photos and videos
7. **Profile** - Personal awards view

## Data Structure

- `global.json` - Global awards data
- `us.json`, `eu.json`, `sea.json`, `latam.json` - Regional awards
- `rankings.json` - Pre-calculated rankings

## Scoring System

- Global Awards: 5 points
- Regional Awards: 3 points
- Departmental Awards: 1 point

## Tech Stack

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript (ES6+)
- GitHub Pages Deployment

## Local Development

Simply open `index.html` in a browser, or serve with any local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

## Deployment

This site is deployed on GitHub Pages. Push to the `gh-pages` branch to deploy.

## License

Internal use only - TikTok Shop
