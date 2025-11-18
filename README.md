# TrackR Skydive Log

A mobile-first web application for tracking skydiving jumps, gear, and work invoices.

## Features

- 📋 **Jump Logging** - Track all your skydives with detailed information
- 🎒 **Gear Management** - Monitor equipment and service dates
- 📍 **Dropzone Directory** - Store dropzone info and billing rates
- 💰 **Work Jump Invoicing** - Generate invoices for AFF, Tandem, Camera work
- 📊 **Statistics** - Track freefall time, cutaways, and jump counts
- 🌙 **Dark Mode** - System-aware theme support
- 📱 **Mobile First** - Optimized for use at the dropzone

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS + shadcn/ui
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Setup

1. **Clone and install:**
   ```bash
   git clone <your-repo>
   cd trackr-skydive-log
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials.

3. **Setup database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open:** http://localhost:3000

### Deployment

Deploy to Vercel:
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main app pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   ├── auth/             # Authentication forms
│   ├── forms/            # Entity forms
│   ├── layouts/          # Layout components
│   └── shared/           # Shared components
├── hooks/                 # Custom React hooks
└── lib/                   # Utilities and clients
    ├── supabase/         # Supabase clients
    ├── validations/      # Zod schemas
    └── utils.ts          # Helper functions
```

## API Endpoints

- `GET/POST /api/jumps` - List/create jumps
- `GET/PATCH/DELETE /api/jumps/[id]` - Jump operations
- `GET/POST /api/dropzones` - Dropzone management
- `GET/POST /api/gear-components` - Gear tracking
- `GET/POST /api/invoices` - Invoice management
- `GET/PATCH /api/user` - User profile

## License

Private - All rights reserved
