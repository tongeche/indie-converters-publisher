# IndieConverters Publishing Platform

An independent publishing platform. Provides comprehensive tools for authors to publish, manage, and market their books.



## Prerequisites

- Node.js 18+
- Supabase account and project
- Environment variables configured

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Add your Supabase credentials
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Apply database migrations**
   ```bash
   supabase db push
   ```

## Environment Variables

Create a `.env.local` file with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable UI components
├── lib/             # Utilities and configurations
└── types/           # TypeScript type definitions

supabase/
├── migrations/      # Database migrations
└── seed/           # Seed data
```

## Features

- 📚 Book catalog and discovery
- ✍️ Author profiles and portfolios
- 🎨 Publishing services marketplace
- 📰 News and blog system
- 🔍 Advanced search and filtering
- 📊 Rating and review system
- 🏷️ Dynamic tagging system


```

See `scripts/README.md` for detailed documentation.

## License

Private project - All rights reserved.
