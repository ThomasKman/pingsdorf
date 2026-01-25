# CLAUDE.md - AI Assistant Guide for Pingsdorf

## Project Overview

**Pingsdorf** is a web application where users can ping items on a map that their significant other forgot to put away. The app provides a playful way to track and highlight misplaced items around a home or shared space.

## Current Project State

This project is in **early-stage development** (initialized January 2026). The repository currently contains:
- `README.md` - Project description
- `.gitignore` - Comprehensive Node.js/TypeScript ignore patterns
- No source code has been written yet

## Intended Technology Stack

Based on the project's `.gitignore` configuration, the expected technology stack includes:

### Core Technologies
- **Runtime:** Node.js
- **Language:** TypeScript
- **Package Manager:** npm or yarn

### Frontend Framework (Likely)
- Next.js, Nuxt.js, or Vue.js (all patterns are included in .gitignore)
- Vite as a potential build tool

### Development Tools
- ESLint for code linting
- Stylelint for CSS linting
- Jest or similar for testing

### Map Functionality
- Will require a mapping library (e.g., Leaflet, Mapbox GL, Google Maps API)

## Project Structure (Recommended)

When building out this project, follow this suggested structure:

```
pingsdorf/
├── src/
│   ├── app/              # App router (Next.js) or pages
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React/Vue hooks
│   ├── lib/              # Utility functions and helpers
│   ├── types/            # TypeScript type definitions
│   └── styles/           # Global styles and themes
├── public/               # Static assets
├── tests/                # Test files
├── .env.example          # Environment variable template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## Development Guidelines

### Code Style
- Use TypeScript for all source files
- Follow ESLint rules once configured
- Use meaningful variable and function names
- Keep components small and focused on a single responsibility

### Git Workflow
- Branch naming: Use descriptive branch names (e.g., `feature/map-component`, `fix/pin-placement`)
- Commit messages: Write clear, concise commit messages describing what changed and why
- Keep commits atomic and focused

### Environment Variables
- Never commit `.env` files with sensitive data
- Use `.env.example` as a template for required environment variables
- Document all environment variables in this file or README

## Key Features to Implement

Based on the project description, core features should include:

1. **Interactive Map Display**
   - Render a map of a home/space
   - Support zooming and panning

2. **Item Pinging**
   - Allow users to place pins/markers on the map
   - Add descriptions to pins (what item, when placed)

3. **User Notifications**
   - Notify the other user when items are pinged
   - Track ping history

4. **User Authentication** (if multi-user)
   - Account creation and login
   - Link accounts between partners

## Commands Reference

Once the project is set up, common commands will likely include:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## AI Assistant Instructions

When working on this codebase:

1. **Before making changes:**
   - Read relevant files to understand existing code
   - Check for existing patterns and conventions
   - Look at package.json for available scripts and dependencies

2. **When writing code:**
   - Follow TypeScript best practices
   - Maintain consistency with existing code style
   - Keep functions and components small and testable
   - Add appropriate error handling

3. **When adding dependencies:**
   - Prefer well-maintained, popular packages
   - Check for existing similar dependencies before adding new ones
   - Document why a dependency was added if not obvious

4. **Testing:**
   - Write tests for new functionality
   - Run existing tests before committing
   - Ensure tests pass before pushing

5. **Documentation:**
   - Update README.md when adding major features
   - Document complex logic with inline comments
   - Keep this CLAUDE.md file updated as the project evolves

## Security Considerations

- Sanitize all user inputs
- Use environment variables for API keys and secrets
- Implement proper authentication if storing user data
- Follow OWASP guidelines for web application security

## Getting Help

- Project issues: Check GitHub Issues
- Framework documentation: Refer to the chosen framework's official docs
- TypeScript: https://www.typescriptlang.org/docs/

---

*Last updated: January 2026*
*Project status: Initial setup - awaiting implementation*
