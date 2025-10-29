# ProShop 24/7 - Frontend

Linear-inspired React + TypeScript frontend for ProShop 24/7.

## Design System

**White Theme with Minimal Color Usage:**
- 99% WHITE/GRAY backgrounds
- Color only for status indicators (tiny pills)
- ONE blue button per page (primary action)
- Professional, clean, engineering-focused aesthetic

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **React Router** - Client-side routing

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Base UI components (Button, Card, Input, etc.)
│   │   └── ChatWidget.tsx   # Chat interface
│   ├── pages/
│   │   ├── LandingPage.tsx  # Marketing site
│   │   └── DemoPage.tsx     # Custom demo interface
│   ├── lib/
│   │   ├── design-system.ts # Colors, typography, spacing
│   │   └── api.ts           # Backend API client
│   ├── App.tsx              # Main router
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

   Frontend runs on `http://localhost:3000`

4. **Make sure backend is running:**
   ```bash
   cd ../backend
   python main.py
   ```

   Backend should be on `http://localhost:8000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Design System Components

### UI Components (`src/components/ui/`)

- **Button** - Primary, secondary, ghost, danger variants
- **Card** - White card with subtle gray border and hover effects
- **Input** - Form inputs with labels, help text, and error states
- **StatusPill** - Colored status indicators (active, booking, missed, etc.)

### Colors

```typescript
// Backgrounds (99% WHITE)
bg.primary: '#FFFFFF'     // Pure white
bg.secondary: '#FAFAFA'   // Subtle gray
bg.tertiary: '#F7F7F8'    // Elevated surfaces

// Text (BLACK/GRAY only)
text.primary: '#1F2127'   // Near-black
text.secondary: '#6B7280' // Muted gray
text.tertiary: '#9CA3AF'  // Light gray

// Accents (MINIMAL usage)
accent.blue: '#3B82F6'    // Primary actions only
accent.green: '#10B981'   // Success states
accent.red: '#EF4444'     // Errors
```

## API Integration

Backend API client in `src/lib/api.ts`:

- **chatAPI.sendMessage()** - Send chat messages
- **demoAPI.createDemo()** - Create custom demo
- **demoAPI.getDemoInfo()** - Get demo details
- **demoAPI.getDemoStatus()** - Check demo status

## Routes

- `/` - Landing page (marketing site)
- `/demo/:slug` - Custom demo page with chat interface

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)

## Building for Production

```bash
npm run build
```

Output goes to `dist/` directory. Serve with any static hosting provider (Vercel, Netlify, Railway, etc.).

## Notes

- Design inspired by Linear.app (professional B2B SaaS aesthetic)
- All components use inline styles for simplicity (can migrate to CSS modules/Tailwind later)
- Vite proxy configured to forward `/v1/*` requests to backend during development
