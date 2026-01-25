# CLAUDE.md - AI Assistant Guide for Pingsdorf

## Project Overview

**Pingsdorf** is a web application where users can ping items on a map that their significant other forgot to put away. The app provides a playful way to track and highlight misplaced items around a home or shared space.

## Current Project State

This project is a **Vite + React + TypeScript** application (initialized January 2026). The basic scaffolding is complete and ready for feature development.

## Technology Stack

### Core Technologies
- **Runtime:** Node.js
- **Language:** TypeScript (~5.8.0)
- **Package Manager:** npm
- **Build Tool:** Vite 7.3.1

### Frontend
- **Framework:** React 19.2.3
- **React DOM:** 19.2.3

### Development Tools
- **Linting:** ESLint 9.25.0 with TypeScript support
- **Type Checking:** TypeScript with strict mode enabled
- **Hot Module Replacement:** Via Vite + @vitejs/plugin-react

### Future Additions (Recommended)
- **Mapping Library:** Leaflet, Mapbox GL, or Google Maps API
- **Testing:** Vitest (Vite-native) or Jest
- **State Management:** React Context, Zustand, or similar (as needed)

## Project Structure

```
pingsdorf/
├── src/
│   ├── main.tsx          # Application entry point
│   ├── App.tsx           # Root React component
│   ├── App.css           # Component-specific styles
│   ├── index.css         # Global styles
│   └── vite-env.d.ts     # Vite type definitions
├── public/
│   └── vite.svg          # Favicon
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config (references)
├── tsconfig.app.json     # TypeScript config for app code
├── tsconfig.node.json    # TypeScript config for Node files
├── eslint.config.js      # ESLint flat config
├── .gitignore            # Git ignore patterns
├── README.md             # Project documentation
└── CLAUDE.md             # This file
```

### Recommended Directory Additions

As the project grows, add these directories to `src/`:

```
src/
├── components/           # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and helpers
├── types/                # TypeScript type definitions
├── features/             # Feature-specific modules
│   ├── map/              # Map display and interaction
│   ├── pins/             # Pin/marker management
│   └── auth/             # Authentication (if needed)
└── assets/               # Images, icons, etc.
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

## Development Guidelines

### Code Style
- Use TypeScript for all source files (`.ts`, `.tsx`)
- Follow ESLint rules (run `npm run lint` to check)
- Use functional components with hooks
- Use meaningful variable and function names
- Keep components small and focused on a single responsibility

### TypeScript Conventions
- Strict mode is enabled - avoid `any` types
- Define interfaces/types in separate files when reused
- Use `type` for unions/intersections, `interface` for object shapes
- Export types alongside components when relevant

### React Patterns
- Use functional components exclusively
- Prefer React hooks for state and side effects
- Keep state as close to where it's used as possible
- Use React.memo() sparingly and only when profiling shows benefit

### File Naming
- React components: PascalCase (`MapView.tsx`, `PinMarker.tsx`)
- Hooks: camelCase with `use` prefix (`useMapInteraction.ts`)
- Utilities: camelCase (`formatDate.ts`, `validateInput.ts`)
- Types: PascalCase (`MapTypes.ts`, `PinData.ts`)

### Git Workflow
- Branch naming: Use descriptive names (e.g., `feature/map-component`, `fix/pin-placement`)
- Commit messages: Write clear, concise messages describing what changed and why
- Keep commits atomic and focused

### Environment Variables
- Never commit `.env` files with sensitive data
- Use `.env.example` as a template for required environment variables
- Access via `import.meta.env.VITE_*` in code

## Key Features to Implement

Based on the project description, core features should include:

1. **Interactive Map Display**
   - Render a map of a home/space
   - Support zooming and panning
   - Custom floor plan support (image overlay)

2. **Item Pinging**
   - Allow users to place pins/markers on the map
   - Add descriptions to pins (what item, when placed)
   - Visual indicators for pin status

3. **User Notifications**
   - Notify the other user when items are pinged
   - Track ping history
   - Mark items as "put away"

4. **User Authentication** (if multi-user)
   - Account creation and login
   - Link accounts between partners

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

5. **Documentation:**
   - Update README.md when adding major features
   - Document complex logic with inline comments
   - Keep this CLAUDE.md file updated as the project evolves

## Security Considerations

- Sanitize all user inputs
- Use environment variables for API keys and secrets
- Implement proper authentication if storing user data
- Follow OWASP guidelines for web application security
- Use HTTPS in production

## Useful Links

- [Vite Documentation](https://vite.dev/guide/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

*Last updated: January 2026*
*Project status: Scaffolded - ready for feature development*
