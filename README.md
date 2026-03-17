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

Build:

```bash
pnpm install --frozen-lockfile
pnpm build
```

Run con PM2:

```bash
pm2 start pnpm --name cms -- start
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
ExecStart=/usr/bin/pnpm --dir /var/www/cms/apps/admin start
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

## Health checks

- `GET /api/health`
- `GET /api/readiness`

`readiness` valida conectividad minima con DB y debe usarse para el reverse proxy o monitoreo.

## Nginx

Configurar reverse proxy hacia la app Node y reenviar:

- `Host`
- `X-Forwarded-For`
- `X-Forwarded-Proto`
- `X-Forwarded-Host`

No expongas publicamente:

- `3000`
- `5432`
- `6379`

## Security Groups recomendados

- `22`: restringido por IP administrativa
- `80`: publico
- `443`: publico

## Despliegue

1. `git pull origin main`
2. `pnpm install --frozen-lockfile`
3. `pnpm build`
4. `pm2 restart cms`

El endpoint interno de deploy debe ejecutarse solo desde usuarios con rol permitido.
