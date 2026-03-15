# Deploying to ratings.beer with Docker Compose

This setup serves:

- Frontend at `https://ratings.beer/`
- Backend API at `https://ratings.beer/api/...`
- Optional public IP fallback at `http://193.46.21.141/`

## 1) Server prerequisites

- Docker Engine with Compose plugin
- DNS `A` record for `ratings.beer` pointing to your server public IP
- Ports `80` and `443` open on your server firewall

## 2) Environment file

Use `.env.production.example` as a starting point.

Required values:

- `DJANGO_SECRET_KEY` (set a long random value)
- `DJANGO_ALLOWED_HOSTS` should include `ratings.beer`
- `DJANGO_CSRF_TRUSTED_ORIGINS` should include `https://ratings.beer`
- `DJANGO_CORS_ALLOWED_ORIGINS` should include `https://ratings.beer`
- `DOMAIN=ratings.beer`
- `PUBLIC_IP=193.46.21.141`

## 3) TLS certificate files

This project is configured to use your provider-issued certificate files (manual TLS), not automatic ACME provisioning.

Expected files:

- `certs/domain.cert.pem`
- `certs/private.key.pem`

If your provider rotates certs, replace these files and restart Caddy:

```bash
docker compose restart caddy
```

## 4) Build and run

From the repository root:

```bash
docker compose up -d --build
```

## 5) Verify

- Frontend: `https://ratings.beer/`
- API health check example: `https://ratings.beer/api/csrf/`
- Django admin: `https://ratings.beer/admin/`
- Public IP fallback: `http://193.46.21.141/`

## 6) Useful commands

```bash
# View logs
docker compose logs -f

# Restart stack
docker compose restart

# Rebuild one service
docker compose build backend
```

## Notes

- Caddy in `deploy/Caddyfile` is configured for manual TLS with mounted cert/key files.
- Public IP access is HTTP only. HTTPS on the raw IP will not match your `ratings.beer` certificate.
- SQLite is persisted in the Docker volume `db_data`.
- Frontend is built with `VITE_API_BASE_URL=/api` so browser calls stay on the same domain.
