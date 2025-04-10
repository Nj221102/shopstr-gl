import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Environment variables
const config = {
  // Server settings
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,
  
  // Cloudflare settings
  cloudflare: {
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
  },
  
  // Domain settings
  domain: process.env.DOMAIN || 'nitishjha.space',
  
  // Environment
  isDevelopment: process.env.NODE_ENV !== 'production',
};

// Validate required environment variables
export const validateConfig = (): boolean => {
  const { cloudflare, domain } = config;
  
  const missingVars = [];
  
  if (!cloudflare.apiToken) missingVars.push('CLOUDFLARE_API_TOKEN');
  if (!cloudflare.zoneId) missingVars.push('CLOUDFLARE_ZONE_ID');
  if (!domain) missingVars.push('DOMAIN');
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
};

export default config; 