# Shopstr Username Registration

A web application that allows users to register Bitcoin usernames using BOLT12 offers. The application consists of a Next.js frontend and a Rust backend using Greenlight.

## Features

- Register Bitcoin usernames with BOLT12 offers
- Configurable offer expiry times (1 minute, 1 hour, 12 hours, 1 day, 1 month, 1 year)
- Automatic DNS record creation using Cloudflare
- Modern, responsive UI with dark theme

## Prerequisites

- Node.js (v18 or later)
- Rust (latest stable)
- Cloudflare account with API access
- Greenlight developer certificate and key

## Project Structure

```
.
├── frontend/              # Next.js frontend application
│   ├── app/              # Next.js app directory
│   ├── public/           # Static files
│   └── .env.example      # Frontend environment variables
├── greenlight-backend/   # Rust backend using Greenlight
│   ├── src/              # Source code
│   └── .env.example      # Backend environment variables
└── README.md             # This file
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd shopstr-gl
```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Cloudflare credentials and domain.

### 3. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd greenlight-backend
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Place your Greenlight certificate and key files in the backend directory:
   - `client.crt`
   - `client-key.pem`

### 4. Running the Application

1. Start the backend server:
   ```bash
   cd greenlight-backend
   cargo run
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Environment Variables

### Frontend (.env)
- `NEXT_PUBLIC_GREENLIGHT_API_URL`: URL of the Greenlight backend (default: http://localhost:8081)
- `CLOUDFLARE_API_KEY`: Your Cloudflare API key
- `CLOUDFLARE_ZONE_ID`: Your Cloudflare zone ID
- `DOMAIN`: Your domain name (e.g., example.com)

### Backend (.env)
- `GL_CERT_PATH`: Path to your Greenlight certificate (default: client.crt)
- `GL_KEY_PATH`: Path to your Greenlight key (default: client-key.pem)

## Development

- Frontend runs on port 3000
- Backend runs on port 8081
- The application uses CORS to allow communication between frontend and backend

## License

[Add your license information here] 