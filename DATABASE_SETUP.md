# Database Setup Guide

This project supports both SQLite (local development) and PostgreSQL (production on Netlify with Neon).

## Local Development (SQLite)

1. **Setup local environment:**

   ```bash
   ./setup-local.sh
   ```

2. **Or manually:**
   ```bash
   cp prisma/schema.sqlite.prisma prisma/schema.prisma
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

## Production (PostgreSQL with Neon)

The production environment automatically uses PostgreSQL with Neon database.

### Environment Variables for Netlify:

Set these in your Netlify environment variables:

- `DATABASE_URL`: Your Neon database connection string
- `DIRECT_URL`: Your Neon direct connection string (optional but recommended)

Example:

```
DATABASE_URL=postgresql://neondb_owner:npg_N0BcPa2hZbnf@ep-raspy-pond-aehepp43-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DIRECT_URL=postgresql://neondb_owner:npg_N0BcPa2hZbnf@ep-raspy-pond-aehepp43.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Database Schema

The schema is identical for both SQLite and PostgreSQL, ensuring consistency between environments.

## Switching Between Databases

- **For local development:** Use `./setup-local.sh`
- **For production:** The main `prisma/schema.prisma` is configured for PostgreSQL
- **Manual switch:** Copy the appropriate schema file to `prisma/schema.prisma`

## Troubleshooting

1. **Local development issues:** Make sure you're using the SQLite schema
2. **Production issues:** Verify your Neon database credentials in Netlify environment variables
3. **Schema sync issues:** Run `npx prisma db push` after switching schemas
