import fetch from 'node-fetch';
import config from '../config.js';
import { CloudflareApiResponse, DNSRecord } from '../types.js';

/**
 * Create a DNS TXT record for a username with a BOLT12 offer
 */
export async function createDnsRecord(
  username: string,
  bolt12Offer: string
): Promise<DNSRecord> {
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

    const data = await response.json() as CloudflareApiResponse;

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

/**
 * For development/testing, simulate a successful DNS record creation
 */
export function simulateDnsRecord(username: string, bolt12Offer: string): DNSRecord {
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