# Shopstr Bitcoin Username Registration

A platform for registering Bitcoin usernames using BOLT12 offers with BIP-353 compliant DNS records. The project consists of a TypeScript-based REST API and a Rust backend using Greenlight.

## Components

- **Username API**: TypeScript REST API for registering Bitcoin usernames with BOLT12 offers
- **Greenlight Backend**: Rust-based service for Greenlight integration

## Project Structure

```
.
├── .github/              # GitHub Actions workflow configurations
│   └── workflows/        # GitHub Actions workflow files
├── username-api/         # TypeScript REST API for username registration
│   ├── src/              # Source code
│   │   ├── routes/       # API route definitions
│   │   └── services/     # Business logic and external services
│   └── README.md         # API-specific documentation
├── greenlight-backend/   # Rust backend using Greenlight
│   ├── src/              # Source code
│   └── Dockerfile        # Container configuration
└── README.md             # This file
```

## Features

- Register Bitcoin usernames with BOLT12 offers
- Automatic DNS record creation using Cloudflare
- Health monitoring via GitHub Actions
- BIP-353 compliant DNS record generation
- Production deployment on Vercel

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/shopstr-gl.git
cd shopstr-gl
```

### 2. Username API Setup

See the [Username API README](./username-api/README.md) for detailed setup instructions.

### 3. Greenlight Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd greenlight-backend
   ```

2. Place your Greenlight certificate and key files in the backend directory:
   - `client.crt`
   - `client-key.pem`

3. Build and run the backend:
   ```bash
   cargo run
   ```

## Health Monitoring

The repository includes an automated GitHub Actions workflow that checks the health of the API endpoint every 5 minutes. 

### Features of the health check:
- Scheduled monitoring every 5 minutes
- Automatic retry for transient failures
- Slack notifications for persistent issues
- Detailed logs in GitHub Actions

### Configuration

To configure the health check, update the following GitHub repository secrets:
- `API_HEALTH_URL`: The URL of your health endpoint
- `SLACK_WEBHOOK`: (Optional) Webhook URL for Slack notifications

## Development

- Username API runs on port 8080 by default
- Greenlight backend runs on port 8081 by default
- Both services have CORS enabled for cross-origin requests

## Deployment

- Username API is deployed on Vercel at https://shopstr-gl.vercel.app
- Greenlight backend can be deployed using the provided Dockerfile

## License

MIT