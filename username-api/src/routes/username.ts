import express from 'express';
import { createDnsRecord, simulateDnsRecord } from '../services/cloudflare.js';
import config from '../config.js';
import { CreateUsernameRequest, ApiResponse } from '../types.js';

const router = express.Router();

/**
 * Create a new username with a BOLT12 offer
 * POST /create-username
 */
router.post('/create-username', async (req, res) => {
  try {
    const { username, bolt12Offer } = req.body as CreateUsernameRequest;

    // Validate request parameters
    if (!username || !bolt12Offer) {
      return res.status(400).json({
        success: false,
        message: 'Username and BOLT12 offer are required',
      } as ApiResponse<never>);
    }

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
    } as ApiResponse<{ 
      username: string; 
      bitcoinAddress: string;
      dnsRecord: typeof dnsRecord 
    }>);
  } catch (error) {
    console.error('Error in create-username route:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    } as ApiResponse<never>);
  }
});

/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', (req, res) => {
  const envInfo = {
    DOMAIN: config.domain,
    CLOUDFLARE_ZONE_ID_SET: !!config.cloudflare.zoneId,
    CLOUDFLARE_API_TOKEN_SET: !!config.cloudflare.apiToken,
  };

  return res.status(200).json({
    success: true,
    message: 'Service is running',
    data: { env: envInfo },
  } as ApiResponse<{ env: typeof envInfo }>);
});

export default router;