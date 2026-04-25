# Azure Deployment Guide (Docker)

This guide details the exact steps and troubleshooting solutions for deploying the Chenda project to a Microsoft Azure Virtual Machine using Docker Compose.

## 1. Prerequisites & Host OS

*   **Virtual Machine**: A Standard **B1ms (2GB RAM)** is recommended to comfortably handle the Next.js build process. If using a **B1s (1GB RAM)**, you *must* configure a Swap file before running `docker compose up --build`.
*   **Operating System**: **Debian 12** is highly recommended over Ubuntu for low-resource VMs, as it  consumes significantly less RAM at idle (~70MB vs ~180MB).
*   **Networking**: Ensure your Azure Network Security Group (NSG) allows inbound traffic on ports `3000` (Frontend) and `3001` (Backend API).
*   **Software**: Install Docker Engine and Docker Compose plugins on the VM.

## 2. Uploading Project Files

Transfer the project files to your Azure VM (e.g., using `rsync` or `scp`). 

**Files/Folders to include:**
*   `docker-compose.yml`
*   `server/`
*   `chenda-frontend/`
*   `migrations/`
*   `package.json` (Root level - *Crucial for migrations*)
*   `.env.example`

> [!WARNING]
> **DO NOT** upload `node_modules/` or `.env.docker` from your local machine.

## 3. Environment Configuration

On the Azure VM, create your production environment file:

```bash
cp .env.example .env.docker
nano .env.docker
```

> [!IMPORTANT]
> Ensure the following variables are explicitly set. The database container (`postgis/postgis`) **requires** `POSTGRES_PASSWORD` to initialize.

```dotenv
POSTGRES_PASSWORD=your_secure_password
DB_PASSWORD=your_secure_password # Must match POSTGRES_PASSWORD
DB_HOST_PORT=5433
SESSION_SECRET=your_random_secure_string
NEXT_PUBLIC_API_URL=http://<YOUR_AZURE_IP>:3001
```

## 4. Initial Build and Startup

Build the images and start the containers in the background:

```bash
docker compose up -d --build
```

Wait a few moments, then check the logs. You will likely see the `backend` container crashing with the error: `database "chenda" does not exist`. **This is expected** and addressed in the next step.

## 5. Database Initialization & PostGIS Setup

By default, the PostgreSQL container initializes but does not automatically create the specific `chenda` database or enable the required spatial extensions for it. 

Run the following commands to manually set up the database structure:

### A. Create the Database
```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE chenda;"
```

### B. Enable PostGIS
The `chenda` database requires the `geometry` type. Enable the extension:
```bash
docker compose exec db psql -U postgres -d chenda -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

## 6. Running Migrations (The Node.js ESM Fix)

Because we did not upload the root `node_modules/` folder to Azure, running the migration script requires a special command. 

We must mount the `migrations` folder, the `.env.docker` file, and the root `package.json` (to force ES Module resolution) directly into the backend container's `/app` directory, where the required dependencies (`dotenv`, `pg`) already exist.

Run this exact command:

```bash
docker compose run --rm \
  -v "$(pwd)/migrations":/app/migrations \
  -v "$(pwd)/.env.docker":/app/.env.docker \
  -v "$(pwd)/package.json":/app/migrations/package.json \
  -w /app \
  --entrypoint node \
  backend migrations/migrate.js up
```

You should see an output indicating all 12+ migrations have been applied successfully.

## 8. Database Seeding (Optional)

If you are using this Azure VM for development, testing, or presentations, you will likely want to populate the database with mock users and product types.

Just like the migration script, `seed.js` is an ES module that requires access to `node_modules`. Because we didn't upload the root `node_modules`, we must use the same mounting trick we used for migrations.

Run this command to safely inject the seeds folder and the root `package.json` into the container:

```bash
docker compose run --rm \
  -v "$(pwd)/seeds":/app/seeds \
  -v "$(pwd)/.env.docker":/app/.env.docker \
  -v "$(pwd)/package.json":/app/seeds/package.json \
  -w /app \
  --entrypoint node \
  backend seeds/seed.js
```

> [!TIP]
> **Image Synchronization:** Ensure that the images from your local `chenda-frontend/public/images/products` folder were successfully pushed to GitHub and pulled down to your Azure VM before seeding. The seeding script relies on reading that directory to link images to the mock products!

## 9. Finalizing Deployment

Now that the database and schema are fully initialized, restart the backend container so it can connect successfully:

```bash
docker compose restart backend
```

Verify everything is running smoothly:

```bash
docker compose ps
docker compose logs backend
```

Your Azure deployment is now complete and functional!
