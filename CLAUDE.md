# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Makisala is a Bun-based monorepo for travel/safari booking with two Next.js 16 apps and shared packages.

## Commands

### Development
```bash
bun --bun next dev          # Start dev server (run from app directory)
bun --bun next build        # Build for production
bun --bun next start        # Start production server
bun --bun next lint         # Run ESLint
```

### Database (from packages/db)
```bash
bun run generate            # Generate Drizzle migrations
bun run migrate             # Run migrations
bun run push                # Push schema to database
bun run studio              # Open Drizzle Studio
```

## Architecture

```
├── apps/
│   ├── makisala/           # Public-facing safari booking site
│   │   └── MDX content, Duffel flight API, Cloudinary images
│   └── kitasuro/           # Proposal dashboard & itinerary builder
│       └── DnD itinerary builder, maps, accommodation management
│
├── packages/
│   ├── db/                 # Drizzle ORM + PostgreSQL (Supabase)
│   ├── ui/                 # 31+ Radix UI components with Tailwind v4
│   └── resend/             # Email service wrapper
│
└── tooling/
    ├── configure-eslint/   # Shared ESLint (Vercel style guide)
    └── configure-typescript/
```

## Key Patterns

- **Package imports**: Use `@repo/{db|ui|resend}` for shared packages
- **Database**: Drizzle ORM with type-safe schema in `packages/db/src/schema.ts`
- **Authentication**: Better Auth with Drizzle adapter - server-side via `auth`, client-side via `authClient`
- **Components**: CVA-based variants on Radix UI primitives
- **Forms**: React Hook Form + Zod v4 validation
- **Environment**: T3-OSS env validation for type safety

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 16 + React 19
- **Database**: PostgreSQL via Drizzle ORM + Supabase
- **Styling**: Tailwind CSS v4
- **UI**: Radix UI primitives
- **Validation**: Zod v4
