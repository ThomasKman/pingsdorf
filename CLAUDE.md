# CLAUDE.md - AI Assistant Guide for Pingsdorf

## Project Overview

**Pingsdorf** is a web application where users can ping items on a map that their significant other forgot to put away. The app provides a playful way to track and highlight misplaced items around a home or shared space.

## Current Project State

This project is a **Vite + React + TypeScript** application (initialized January 2026). Core features are implemented:

- Interactive floor plan with pan and zoom
- Add pings with drag-and-drop positioning
- Name, description, and optional photo for each ping
- Sidebar with ping list and details
- Edit and delete pings

## Technology Stack

### Core Technologies
- **Runtime:** Node.js
- **Language:** TypeScript (~5.8.0)
- **Package Manager:** npm
- **Build Tool:** Vite 7.3.1

### Frontend
- **Framework:** React 19.2.3
- **React DOM:** 19.2.3
- **Pan/Zoom:** react-zoom-pan-pinch

### Development Tools
- **Linting:** ESLint 9.25.0 with TypeScript support
- **Type Checking:** TypeScript with strict mode enabled
- **Hot Module Replacement:** Via Vite + @vitejs/plugin-react

## Project Structure

```
pingsdorf/
├── src/
│   ├── components/
│   │   ├── PingMarker.tsx    # Ping marker with placement form
│   │   ├── PingMarker.css
│   │   ├── Sidebar.tsx       # Sidebar with ping list (grouped by room)
│   │   ├── Sidebar.css
│   │   ├── RoomOverlay.tsx   # SVG overlay for room boundaries
│   │   ├── RoomOverlay.css
│   │   ├── RoomEditor.tsx    # Panel for managing rooms
│   │   └── RoomEditor.css
│   ├── types/
│   │   ├── Ping.ts           # Ping interface definition
│   │   └── Room.ts           # Room and Point interfaces
│   ├── utils/
│   │   └── geometry.ts       # Point-in-polygon detection
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root React component
│   ├── App.css               # Main app styles
│   ├── index.css             # Global styles
│   └── vite-env.d.ts         # Vite type definitions
├── public/
│   └── vite.svg              # Favicon
├── index.html                # HTML entry point
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript config
├── eslint.config.js          # ESLint flat config
└── CLAUDE.md                 # This file
```

## Commands Reference

```bash
# Install dependencies
npm install

# Run development server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Implemented Features

### Interactive Map Display
- Pan and zoom floor plan image
- Zoom controls (in, out, reset)
- Centered display with proper aspect ratio

### Item Pinging
- "Add Ping" button to create new pings
- Drag-and-drop positioning on the map
- Inline form for name, description, and photo
- Pings stay positioned relative to floor plan
- Visual indicators (red dots with pulse animation)
- Photo indicator (📷) on pings with images

### Sidebar
- List of all pings with thumbnails
- Click to select and highlight on map
- Edit name and description inline
- Delete pings
- Selected ping details panel with full image

### Room Management
- Settings panel to define rooms on the floor plan
- Draw room boundaries by clicking corners on the map
- Pings automatically categorized by room (ray-casting algorithm)
- Sidebar grouped by room with collapsible sections
- "Other" category for pings outside defined rooms
- Edit room names and colors

## Future Features (Planned)

### 1. Multi-User Support
- Add multiple users with authentication
- Pings are owned by the user who created them
- Other users can view but not edit pings
- "Clean up" functionality for completing pings
- Sidebar split into "Your Pings" and "Partner's Pings"
- Optional ping history view

### 2. User Authentication
- Login/signup flow
- Account linking between partners
- Session management
- Profile settings

### 3. Responsiveness / Mobile Layout
- Mobile-friendly UI
- Touch-optimized interactions
- Responsive sidebar

### 4. Docker Container Deployment
- Dockerfile for production builds
- Docker Compose configuration
- Environment variable management

### 5. Backend and Database
- Consider separate project for backend
- User data persistence
- Real-time sync between users
- API design

## Development Guidelines

### Code Style
- Use TypeScript for all source files (`.ts`, `.tsx`)
- Follow ESLint rules (run `npm run lint` to check)
- Use functional components with hooks
- Use meaningful variable and function names
- Keep components small and focused

### TypeScript Conventions
- Strict mode is enabled - avoid `any` types
- Define interfaces/types in `src/types/`
- Use `type` for unions/intersections, `interface` for object shapes

### React Patterns
- Use functional components exclusively
- Prefer React hooks for state and side effects
- Keep state as close to where it's used as possible

### File Naming
- React components: PascalCase (`PingMarker.tsx`)
- Hooks: camelCase with `use` prefix (`useMapInteraction.ts`)
- Types: PascalCase (`Ping.ts`)

## AI Assistant Instructions

When working on this codebase:

1. **Before making changes:**
   - Read relevant files to understand existing code
   - Check for existing patterns and conventions
   - Review `package.json` for available scripts and dependencies

2. **When writing code:**
   - Follow TypeScript best practices (no `any`, proper typing)
   - Maintain consistency with existing code style
   - Keep functions and components small and testable
   - Add appropriate error handling

3. **When adding dependencies:**
   - Prefer well-maintained, popular packages
   - Check for existing similar dependencies before adding new ones
   - Use `npm install <package>` for runtime deps
   - Use `npm install -D <package>` for dev deps

4. **Building and verification:**
   - Run `npm run build` to check for TypeScript errors
   - Run `npm run lint` to check for linting issues
   - Test changes with `npm run dev` when possible

## Security Considerations

- Images are stored as base64 in memory (limited to 5MB each)
- No backend/authentication currently - all data is client-side only
- Sanitize all user inputs when backend is added
- Use environment variables for API keys and secrets
- Use HTTPS in production

## Useful Links

- [Vite Documentation](https://vite.dev/guide/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [react-zoom-pan-pinch](https://github.com/BetterTyped/react-zoom-pan-pinch)

---

*Last updated: January 2026*
*Project status: Core features implemented*
