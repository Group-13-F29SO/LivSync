# Database Setup Guide

This guide walks you through setting up PostgreSQL with Prisma for the LivSync project.

## Prerequisites

- **Node.js**: v20.19.0 or higher (or at least v20.18.0)
- **PostgreSQL**: 12 or higher
- **PostgreSQL Server**: Running and accessible locally or remotely

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd LivSync
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all necessary packages, including Prisma.

## Step 3: Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example` if available):

```bash
# .env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME"
```

**Replace the following:**
- `USERNAME`: Your PostgreSQL username (usually `postgres`)
- `PASSWORD`: Your PostgreSQL password
- `localhost`: Your PostgreSQL host (change if using remote server)
- `5432`: Your PostgreSQL port (default is 5432)
- `DATABASE_NAME`: Your database name (e.g., `LivSync`)

### Example:
```bash
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/LivSync"
```

## Step 4: Create the Database (if it doesn't exist)

Using PostgreSQL CLI:

```bash
psql -U postgres -c "CREATE DATABASE LivSync;"
```

Or using a GUI tool like pgAdmin.

## Step 5: Enable UUID Extension

Run this SQL command in your database:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

You can do this through:
- **pgAdmin**: SQL Query Tool
- **psql CLI**: 
  ```bash
  psql -U postgres -d LivSync -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
  ```

## Step 6: Run Migrations

Apply all database migrations:

```bash
npx prisma migrate dev
```

This will create all tables and set up the schema in your database.


## Step 7: Generate Prisma Client (Optional)

If needed, regenerate the Prisma client:

```bash
npx prisma generate
```

## Troubleshooting

### Error: `Database error code: 42883` - function uuid_generate_v4() does not exist

**Solution:** The `uuid-ossp` extension is not enabled. Run:

```bash
psql -U postgres -d LivSync -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### Error: `Cannot connect to database`

**Checklist:**
1. PostgreSQL server is running (`sudo systemctl status postgresql` on Linux/Mac)
2. Database exists: `psql -U postgres -l` (list all databases)
3. Credentials are correct in `.env`
4. Port is correct (default: 5432)
5. Firewall isn't blocking the connection

### Error: `Cannot find module @prisma/client`

**Solution:** Reinstall dependencies:

```bash
npm install
```

If still failing, clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: `A migration failed to apply`

**Solution:** Reset migrations (only in development):

```bash
npx prisma migrate reset
```

⚠️ **WARNING**: This will delete all data in your database. Use only in development!

## Common Commands

### View Database Schema
```bash
npx prisma studio
```
Opens a GUI to browse and edit your database.

### Check Migration Status
```bash
npx prisma migrate status
```

### Create a New Migration
After changing `schema.prisma`:

```bash
npx prisma migrate dev --name your_migration_name
```

### Rollback to Previous Migration
```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

## Quick Start Script

Create a `setup-db.sh` (Unix/Mac) or `setup-db.ps1` (Windows) file:

**For Unix/Mac (`setup-db.sh`):**
```bash
#!/bin/bash

echo "🚀 Setting up LivSync Database..."

# Create database
psql -U postgres -c "CREATE DATABASE LivSync;"

# Enable UUID extension
psql -U postgres -d LivSync -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Test connection
node test-db.js

echo "✅ Database setup complete!"
```

**For Windows PowerShell (`setup-db.ps1`):**
```powershell
Write-Host "🚀 Setting up LivSync Database..."

# Create database
psql -U postgres -c "CREATE DATABASE LivSync;"

# Enable UUID extension
psql -U postgres -d LivSync -c "CREATE EXTENSION IF NOT EXISTS 'uuid-ossp';"

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Test connection
node test-db.js

Write-Host "✅ Database setup complete!"
```

## Database Models

Your current database includes the following tables:
- `achievements` - Application achievements/badges
- `admins` - Admin user accounts
- And more (see `prisma/schema.prisma`)

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/orm/reference/database-reference/postgresql)

## Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Review the error message carefully
3. Check your `.env` file is correct
4. Ensure PostgreSQL is running
5. Reach out to the team lead

---

**Last Updated:** January 8, 2026
