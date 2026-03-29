# LivSync

A comprehensive health management platform that connects patients and healthcare providers for seamless health information synchronization, appointment scheduling, and personalized health tracking.

## Prerequisites

Before getting started, ensure you have the following installed on your system:

- **Node.js** 
- **PostgreSQL**
- **pgAdmin** 
- **Git** 

## Installation and Setup

### Step 1: Install PostgreSQL and pgAdmin

#### On Windows:
1. Download the PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. When prompted, set a password for the `postgres` user (remember this for later)
4. Keep the default port as `5432`
5. Complete the installation
6. pgAdmin should be installed automatically with PostgreSQL; if not, install it separately


### Step 2: Create Your Database (Optional)

**Note:** Prisma migrations will automatically create the database if it doesn't exist. You can skip this step and proceed directly to Step 3. However, if it is unable to create the database or you prefer to create the database manually:

1. Open **pgAdmin** (search for it in your applications)
2. Right-click on **Databases** and select **Create > Database**
3. Enter a database name (e.g., `livsync`)
4. Click **Save**


### Step 3: Configure Environment Variables

1. Open the `.env.example` file in the project root
2. Add your database credentials in the following format:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
   ```
   
   Example:
   ```
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/livsync"
   ```

3. Configure Gmail SMTP for password reset emails **(Optional)**:
   - **Note:** Gmail SMTP configuration is optional. If not configured, the password reset functionality won't work, but all other features of the application will function normally.
   - To enable password reset emails, go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Generate a 16-digit app password
   - Add to `.env.example`:
   ```
   GMAIL_EMAIL=your-email@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

4. **Rename `.env.example` to `.env`**:

### Step 4: Install Project Dependencies

```bash
npm install
```

### Step 5: Run Database Migrations

Navigate to the project directory and run the Prisma migrations:

```bash
npx prisma migrate deploy
```

**Note:** If you encounter issues with `npx prisma migrate run dev`, use `npx prisma migrate deploy` instead, which is the recommended approach for production-like environments.

### Step 6: Generate Prisma Client

Generate the Prisma client to ensure all types are available:

```bash
npx prisma generate
```

### Step 7: Start the Development Server

```bash
npm run dev
```

The application should now be running at **http://localhost:3000**

---

## Project Structure

```
LivSync/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── context/          # Context API for state management
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries and services
│   ├── styles/           # Global styles
│   └── utils/            # Utility functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── public/               # Static assets
├── docs/                 # Documentation
└── package.json          # Project dependencies
```

## Database Schema

The database includes tables for:
- Users (Patients and Providers)
- Health metrics (Blood Glucose, Heart Rate, Hydration, Sleep, etc.)
- Appointments and Reminders
- Prescriptions
- Chat and Notifications
- Articles and Badges
- Security Logs
- Two-factor Authentication

View the complete schema in `prisma/schema.prisma`


## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify the `DATABASE_URL` in your `.env` file is correct
- Check that the database and user exist in PostgreSQL

### Migration Failures / Database Auto-Creation Errors
When running `npx prisma migrate deploy`, Prisma attempts to automatically create the database if it doesn't exist. This may fail if:
- The PostgreSQL user doesn't have `CREATE DATABASE` permissions
- The PostgreSQL server isn't running or is unreachable
- The password in `DATABASE_URL` is incorrect
- The database name contains invalid characters

**Solution:**
If migrations fail during auto-creation, manually create the database first (see Step 2), then run the migrations again:

```bash
npx prisma migrate deploy
```

Once the database exists, Prisma only needs to connect and apply migrations, which requires fewer permissions and is less likely to fail.

**Additional troubleshooting:**
- If migrations still fail after manual creation, ensure your database is empty and restart: `npx prisma migrate resolve --rolled-back`
- Drop and recreate the database using pgAdmin, then run migrations again

### Missing Dependencies
- If you encounter missing package errors, run `npm install` again
