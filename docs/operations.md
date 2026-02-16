# Operations Guide

Logging, monitoring, and troubleshooting for JobFlow.

## Logging

### Configuration

The backend uses structured logging with [pino](https://github.com/pinojs/pino). Logs are output to stdout in human-readable format and managed by Docker's logging driver.

**Log Levels:** Configure via the `LOG_LEVEL` environment variable:

| Level   | Description                    |
| ------- | ------------------------------ |
| `error` | Only errors                    |
| `warn`  | Warnings and errors            |
| `info`  | General information (default)  |
| `debug` | Detailed debugging information |

**Log Retention:** Docker is configured to retain up to 1GB of logs (10 files × 100MB each).

### Viewing Logs

```bash
# View recent backend logs
docker logs jobflow-backend

# Follow logs in real-time
docker logs -f jobflow-backend

# View logs from the last hour
docker logs --since 1h jobflow-backend

# View last 100 lines
docker logs --tail 100 jobflow-backend

# View Caddy (reverse proxy) logs
docker logs jobflow-caddy

# View Cloudflare Tunnel logs
docker logs jobflow-cloudflared

# View all service logs
docker compose -f docker-compose.prod.yml logs -f
```

## Correlation IDs (Request Tracing)

Every API request is assigned a unique correlation ID (`X-Request-ID` header). This ID appears in:

- Backend logs
- API error responses
- Frontend error boundary (when an error occurs)

### Finding logs for a specific error

```bash
# Search by correlation ID
docker logs jobflow-backend 2>&1 | grep "abc123-your-correlation-id"
```

### Example log output

```
[2024-01-15 10:30:45] INFO: GET /api/jobs 200
    requestId: "abc123-uuid-here"
    userId: "user-uuid"
    responseTime: 45
```

## Health & Metrics

| Endpoint       | Auth     | Description                              |
| -------------- | -------- | ---------------------------------------- |
| `/api/health`  | Public   | Basic health check (status + DB)         |
| `/api/metrics` | Required | Detailed metrics (memory, CPU, uptime)   |

### Health check example

```bash
curl https://jobflow.sapir.io/api/health
```

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "database": "ok"
}
```

## Troubleshooting

### Error with correlation ID displayed

1. Copy the correlation ID from the error screen
2. Search logs:
   ```bash
   docker logs jobflow-backend 2>&1 | grep "correlation-id"
   ```

### Database connection issues

1. Check health endpoint (from inside the Pi):
   ```bash
   curl http://localhost:80/api/health
   ```
2. If `database: "error"`, check PostgreSQL:
   ```bash
   docker logs jobflow-db
   ```

### High memory usage

1. Check metrics (requires auth token):
   ```bash
   curl -H "Authorization: Bearer $TOKEN" http://localhost:80/api/metrics
   ```
2. Restart backend:
   ```bash
   docker restart jobflow-backend
   ```

### Container won't start

1. Check container logs:
   ```bash
   docker logs jobflow-backend
   ```
2. Check if port is in use:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
3. Verify environment variables:
   ```bash
   docker compose -f docker-compose.prod.yml config
   ```

### Cloudflare Tunnel issues

1. Check `cloudflared` container logs:
   ```bash
   docker logs jobflow-cloudflared
   ```
2. Verify the tunnel is running:
   ```bash
   cloudflared tunnel info <TUNNEL_ID>
   ```
3. Ensure `cloudflared-credentials.json` exists and is valid
4. Check Cloudflare dashboard for tunnel status at https://one.dash.cloudflare.com
