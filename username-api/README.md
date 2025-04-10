# Bitcoin Username API

A TypeScript-based REST API for registering Bitcoin usernames with BOLT12 offers using BIP-353 compliant DNS records.

## Features

- Create Bitcoin usernames with BOLT12 offers
- Automatically adds TXT DNS records to your Cloudflare zone
- Configurable domain for username registration
- CORS enabled for cross-domain requests
- TypeScript for type safety
- Development mode with simulated responses

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Cloudflare account](https://dash.cloudflare.com/sign-up) with access to your domain's DNS zone
- [Cloudflare API token](https://dash.cloudflare.com/profile/api-tokens) with DNS edit permissions

## Setup

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/username-api.git
   cd username-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a .env file based on .env.example:
   ```
   cp .env.example .env
   ```

4. Fill in your Cloudflare credentials in the .env file:
   ```
   CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
   CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id
   DOMAIN=your-domain.com  # The domain where usernames will be registered
   PORT=8080               # The port to run the API on
   ```

## Development

Run the server in development mode with auto-reload:

```
npm run dev
```

The API will be available at http://localhost:8080.

## Building and Running for Production

Build the TypeScript code:

```
npm run build
```

Start the production server:

```
npm start
```

## API Endpoints

### Create Username

**POST /create-username**

Creates a new Bitcoin username with a BOLT12 offer.

**Request Body:**

```json
{
  "username": "satoshi",
  "bolt12Offer": "lno1..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Username created successfully",
  "data": {
    "username": "satoshi@your-domain.com",
    "dnsRecord": {
      "id": "dns-record-id",
      "name": "satoshi.your-domain.com",
      "type": "TXT",
      "content": "lno1...",
      "ttl": 1,
      "created_on": "2023-10-25T12:34:56.789Z"
    }
  }
}
```

### Health Check

**GET /health**

Checks if the API is running.

**Response:**

```json
{
  "success": true,
  "message": "Service is running",
  "data": {
    "env": {
      "DOMAIN": "your-domain.com",
      "CLOUDFLARE_ZONE_ID_SET": true,
      "CLOUDFLARE_API_TOKEN_SET": true
    }
  }
}
```

## Integration with Frontend

To integrate with a frontend application, set your frontend environment variable:

```
NEXT_PUBLIC_USERNAME_API_URL=http://localhost:8080
```

## License

MIT 