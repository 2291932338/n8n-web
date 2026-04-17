# WorkflowStudio account platform deployment notes

This project now runs as three services:

- `workflow-studio`: React/Vite frontend served by Nginx.
- `workflow-backend`: Node.js API for auth, admin stats, task ownership, and n8n proxying.
- `workflow-postgres`: PostgreSQL database for users and workflow usage records.

## Local development

Start the local database and backend containers:

```powershell
docker compose -f docker-compose.dev.yml up -d --build backend
```

Then start the frontend in another terminal:

```powershell
npm run dev
```

Default development admin account:

```text
admin@example.com
change-this-password
```

Stop local containers:

```powershell
docker compose -f docker-compose.dev.yml stop
```

## Production server

On the server, copy `production.env.example` to `.env` and fill all real secrets and webhook URLs.

Deploy or update:

```bash
docker compose pull
docker compose up -d
```

The backend image runs `prisma migrate deploy` and `seed:admin` on startup. If the admin already exists, it only ensures the account is active and has admin role.

## Important security notes

- Never commit `.env`.
- Use a strong `POSTGRES_PASSWORD` and `SESSION_SECRET`.
- If you use HTTPS, set `COOKIE_SECURE=true` and `FRONTEND_ORIGIN=https://your-domain`.
- Keep n8n webhook URLs only in server `.env`, not in frontend source.
