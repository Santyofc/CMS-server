# CMS Server

Business Control Plane para operar infraestructura, repositorios, despliegues y DNS desde un panel Next.js.

## Requisitos

- Node.js 20+
- pnpm 9+
- Postgres accesible desde la aplicacion
- Redis accesible desde la aplicacion para rate limiting distribuido en produccion
- Nginx delante de la app
- PM2 o systemd para proceso persistente

## Variables de entorno

Ver [env.example](/c:/Users/Dev%20Profile/Desktop/CMS/env.example).

Minimas para produccion:

- `DATABASE_URL`
- `REDIS_URL`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `TRUST_PROXY=true` solo si Nginx reenvia `Host` y `X-Forwarded-*` correctamente
- credenciales de providers que realmente uses

## Desarrollo

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

## Migraciones

Generar:

```bash
pnpm db:generate
```

Aplicar:

```bash
pnpm db:migrate
```

El pipeline ejecuta `pnpm check:migrations` dentro de `pnpm lint` y bloquea patrones inseguros como `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` y `DELETE FROM`.

## Produccion en EC2

Ruta esperada:

- `/var/www/cms`

Prepara la instancia:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
sudo mkdir -p /var/www/cms
sudo chown -R "$USER:$USER" /var/www/cms
```

Clona el repo y crea `/var/www/cms/.env` en formato dotenv simple:

```bash
git clone https://github.com/Santyofc/CMS-server.git /var/www/cms
cd /var/www/cms
cp env.example .env
```

Reglas del parser de `.env`:

- un `KEY=VALUE` por linea
- `&` no necesita comillas
- usa comillas solo si el valor contiene espacios, `#` literal o whitespace al inicio/final
- no uses multilinea ni expansion de shell

Variables minimas para deploy:

- `NODE_ENV=production`
- `APP_URL=https://cms.zonasurtech.online`
- `NEXT_PUBLIC_APP_URL=https://cms.zonasurtech.online`
- `TRUST_PROXY=true`
- `DATABASE_URL=...`
- `REDIS_URL=...`
- `LOG_LEVEL=info`

El runtime de la app escucha en `127.0.0.1:3001` y Nginx debe hacer proxy a ese puerto.

Build:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrate
```

Run con PM2:

```bash
chmod +x scripts/deploy.sh scripts/rollback.sh scripts/run-admin.sh
pnpm exec pm2 startOrReload ecosystem.config.cjs --only cms --update-env
pm2 save
```

Run con systemd:

```ini
[Unit]
Description=CMS Control Plane
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/cms
Environment=NODE_ENV=production
ExecStart=/bin/bash /var/www/cms/scripts/run-admin.sh
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

## Health checks

- `GET /api/health`
- `GET /api/readiness`

`readiness` valida conectividad minima con DB y debe usarse para el reverse proxy o monitoreo.

Validacion local:

```bash
curl --fail http://127.0.0.1:3001/api/health
curl --fail http://127.0.0.1:3001/api/readiness
```

Validacion publica:

```bash
curl --fail https://cms.zonasurtech.online/api/health
curl --fail https://cms.zonasurtech.online/api/readiness
```

## Nginx

Configurar reverse proxy hacia la app Node y reenviar:

- `Host`
- `X-Forwarded-For`
- `X-Forwarded-Proto`
- `X-Forwarded-Host`

No expongas publicamente:

- `3001`
- `5432`
- `6379`

## Security Groups recomendados

- `22`: restringido por IP administrativa
- `80`: publico
- `443`: publico

## Despliegue

CI/CD:

- Workflow: `.github/workflows/deploy.yml`
- Triggers: `push` a `main` y `workflow_dispatch`
- Orden: `install -> lint -> typecheck -> test -> build -> deploy SSH`
- Deploy remoto: `scripts/deploy.sh`
- Rollback basico: `scripts/rollback.sh`

Secrets requeridos en GitHub:

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `EC2_PORT` (opcional, default `22`)

Deploy manual en EC2:

```bash
cd /var/www/cms
chmod +x scripts/deploy.sh scripts/rollback.sh scripts/run-admin.sh
bash scripts/deploy.sh
```

Rollback manual:

```bash
cd /var/www/cms
bash scripts/rollback.sh <commit-previo>
```

Si solo hiciste `git reset --hard <commit>` en el servidor:

```bash
cd /var/www/cms
pnpm install --frozen-lockfile
pnpm build
pnpm db:migrate
pnpm exec pm2 startOrReload ecosystem.config.cjs --only cms --update-env
curl --fail http://127.0.0.1:3001/api/health
curl --fail http://127.0.0.1:3001/api/readiness
```

Logs utiles:

```bash
pm2 status
pm2 logs cms --lines 100
sudo nginx -t
sudo systemctl status nginx --no-pager
```

El deploy y rollback esperan unos segundos tras `pm2 startOrReload` y reintentan probes con tolerancia a errores transitorios del upstream (`502`, `connection refused`) antes de marcar fallo.

El endpoint interno de deploy debe ejecutarse solo desde usuarios con rol permitido.
