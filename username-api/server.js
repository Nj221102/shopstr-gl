// This file helps Vercel properly route to the correct entry point
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Dynamically import the built module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from environment variables
const config = {
  cloudflare: {
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
  },
  domain: process.env.DOMAIN || 'nitishjha.space',
  port: parseInt(process.env.PORT || '3000', 10),
  isDevelopment: process.env.NODE_ENV !== 'production',
};

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Check if the compiled code exists
const distPath = path.join(__dirname, 'dist');
const usernameRoutesPath = path.join(distPath, 'routes', 'username.js');

// Simple API endpoints for debugging
app.get('/', (req, res) => {
  // Check if compiled files exist for debugging
  const distExists = fs.existsSync(distPath);
  const routesExist = fs.existsSync(usernameRoutesPath);
  
  res.json({
    success: true,
    message: 'Bitcoin Username API',
    data: {
      version: '1.0.0',
      status: 'Running',
      config: {
        domain: config.domain,
        cloudflareZoneIdSet: !!config.cloudflare.zoneId,
        cloudflareApiTokenSet: !!config.cloudflare.apiToken,
      },
      debug: {
        distExists,
        routesExist
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const envInfo = {
    DOMAIN: config.domain,
    CLOUDFLARE_ZONE_ID_SET: !!config.cloudflare.zoneId,
    CLOUDFLARE_API_TOKEN_SET: !!config.cloudflare.apiToken,
  };

  res.json({
    success: true,
    message: 'Service is running',
    data: { env: envInfo }
  });
});

// Function to create a DNS TXT record for a username with a BOLT12 offer
async function createDnsRecord(username, bolt12Offer) {
  try {
    // Format the hostname according to BIP 353
    const hostname = `${username.toLowerCase()}.user._bitcoin-payment`;
    const domain = config.domain;
    
    // Format the content according to BIP 353
    const formattedContent = `"bitcoin:?lno=${bolt12Offer}"`;
    
    // Create the DNS record using Cloudflare API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.cloudflare.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'TXT',
          name: `${hostname}.${domain}`,
          content: formattedContent,
          ttl: 3600, // 1 hour TTL
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      const errorMsg = data.errors[0]?.message || 'Failed to create DNS record';
      console.error('Cloudflare API error:', data.errors);
      throw new Error(errorMsg);
    }

    // Return the created DNS record
    return {
      id: data.result.id,
      name: data.result.name,
      type: data.result.type,
      content: data.result.content,
      ttl: data.result.ttl,
      created_on: data.result.created_on,
    };
  } catch (error) {
    console.error('Error creating DNS record:', error);
    throw error;
  }
}

// Simulate DNS record creation for development or when missing Cloudflare credentials
function simulateDnsRecord(username, bolt12Offer) {
  const hostname = `${username.toLowerCase()}.user._bitcoin-payment`;
  const domain = config.domain;
  const formattedContent = `"bitcoin:?lno=${bolt12Offer}"`;
  
  return {
    id: 'simulated-record-' + Date.now(),
    name: `${hostname}.${domain}`,
    type: 'TXT',
    content: formattedContent,
    ttl: 3600,
    created_on: new Date().toISOString(),
  };
}

// Create username endpoint
app.post('/create-username', async (req, res) => {
  const { username, bolt12Offer } = req.body;
  
  // Basic validation
  if (!username || !bolt12Offer) {
    return res.status(400).json({
      success: false,
      message: 'Username and BOLT12 offer are required'
    });
  }
  
  try {
    let dnsRecord;
    
    if (config.isDevelopment && (!config.cloudflare.apiToken || !config.cloudflare.zoneId)) {
      // If in development and missing Cloudflare credentials, simulate a successful response
      console.log('Using simulated DNS record creation (development mode)');
      dnsRecord = simulateDnsRecord(username, bolt12Offer);
    } else {
      // Create actual DNS record
      dnsRecord = await createDnsRecord(username, bolt12Offer);
    }

    // Return the DNS record and formatted username according to BIP 353
    return res.status(200).json({
      success: true,
      message: 'Username created successfully',
      data: {
        username: `${username}@${config.domain}`,
        bitcoinAddress: `${username}.user._bitcoin-payment.${config.domain}`,
        dnsRecord,
      },
    });
  } catch (error) {
    console.error('Error in create-username route:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Start the server if not being imported by Vercel
const PORT = config.port;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;