# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beast Games Tracker is a fantasy scoring web application for tracking contestants in the Beast Games competition show. The app features a three-phase workflow: Setup → Draft → Scoring. Users configure teams, draft contestants in turn-based fashion, and track scores across episodes with full persistence via localStorage.

## Tech Stack

- **Framework**: React 19 with Vite
- **Language**: JavaScript (JSX)
- **Styling**: Tailwind CSS (via inline classes)
- **Icons**: lucide-react
- **Deployment**: GitHub Pages via gh-pages

## Development Commands

```bash
# Start development server (HMR enabled)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint

# Deploy to GitHub Pages
npm run deploy
```

## Architecture

### Three-Phase Workflow

1. **Setup Phase**: Configure team names and build the contestant pool
2. **Draft Phase**: Teams alternate picking contestants from the pool
3. **Scoring Phase**: Track scores, eliminations, and episode progression

### State Management

The application uses React hooks for state management with localStorage persistence:
- `phase`: Current workflow phase ('setup' | 'draft' | 'scoring')
- `contestants`: Array of drafted contestant objects with scores
- `availableContestants`: Pool of contestants available for drafting
- `team1Name` / `team2Name`: Configurable team names
- `currentEpisode`: Tracks which episode is being scored
- `draftTurn`: Tracks whose turn it is during draft (1 or 2)
- All state automatically saves to localStorage on every change

### Data Structure

**Contestant object:**
```javascript
{
  id: number,           // Timestamp-based unique ID
  name: string,
  team: 1 | 2,
  active: boolean,      // false when eliminated
  scores: [
    {
      episode: number,
      items: [
        { type: string, value: number }
      ]
    }
  ]
}
```

### Scoring System

Points are calculated by:
- Core actions: Survive episode (+5), Individual win (+15), Team win (+10), Elimination (-10)
- Money conversion: $5,000 = 1 point
- Bonuses: Gave up money (+15), Risky deal (+10), Highest cash (+10), Viral moment (+5)
- Endgame bonuses: Winner (+50), Final 3 (+25), Final 5 (+15)

## Key Components

### BeastGamesTracker (App.jsx)

The main application component contains all logic. The UI conditionally renders based on `phase`:

**Setup Phase:**
- Team name configuration inputs
- Textarea for bulk contestant pool entry (one per line)
- Display of current draft pool with contestant chips
- "Start Draft" button to proceed

**Draft Phase:**
- Turn indicator showing whose pick it is
- Clickable contestant cards for selection
- Live preview of both teams' rosters
- Auto-progression to scoring when pool is empty

**Scoring Phase:**
- Team score summary cards with active/eliminated counts
- Episode navigation with left/right arrows
- Contestant cards with collapsible score history
- QuickScore component for adding actions
- Scoring reference table

**Sub-components:**
- **QuickScore**: Enhanced dropdown menu with predefined scoring actions and custom money input
- Score history displayed as collapsible `<details>` elements

### Styling Approach

The app uses Tailwind utility classes directly in JSX. Modern design with:
- Rounded corners (rounded-xl, rounded-lg)
- Gradient backgrounds (from-purple-600 via-pink-600 to-blue-600)
- Smooth transitions and hover effects
- Shadow layers (shadow-sm, shadow-md, shadow-lg, shadow-xl)
- Responsive breakpoints (md:, lg:)

Color scheme:
- Team 1: Green gradients (from-green-500 to-green-600)
- Team 2: Blue gradients (from-blue-500 to-blue-600)
- Primary actions: Purple-to-blue gradients
- Eliminated contestants: Reduced opacity with red "ELIMINATED" badge
- Score history: Collapsible with purple episode indicators

## Build Configuration

### Vite Config (vite.config.js)

- Uses `@vitejs/plugin-react` for Fast Refresh
- Base path set to `'beast-games-tracker'` for GitHub Pages deployment

### ESLint Config (eslint.config.js)

- Uses flat config format (ESLint 9+)
- Configured for React with hooks and refresh plugins
- Custom rule: Allows unused variables matching pattern `^[A-Z_]` (typically constants)
- Ignores `dist` directory

## Project Structure

```
src/
  App.jsx         - Main application component
  main.jsx        - React entry point
  index.css       - Global styles
  assets/         - Static assets (React logo)
public/           - Public static files (Vite logo)
```

## Important Notes

- **Persistence**: All data saved to localStorage automatically on every state change
- **Data Recovery**: App loads saved state on refresh/reload
- **Reset Functionality**: "Reset" button clears localStorage and reloads page
- **No Backend**: Fully client-side application
- **Single-page application** with conditional rendering based on phase
- **Deployed to GitHub Pages** at repository path `/beast-games-tracker/`
- **Uses React 19 features** (createRoot from react-dom/client)
- **Mobile Responsive**: Uses Tailwind responsive breakpoints (md:, lg:)

### LocalStorage Schema

Data stored under key `'beast-games-data'`:
```javascript
{
  phase: 'setup' | 'draft' | 'scoring',
  contestants: [...],           // Drafted contestants
  availableContestants: [...],  // Remaining draft pool
  team1Name: string,
  team2Name: string,
  currentEpisode: number,
  draftTurn: 1 | 2
}
```
