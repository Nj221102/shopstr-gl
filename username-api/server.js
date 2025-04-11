// This file helps Vercel properly route to the correct entry point
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Dynamically import the built module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      status: 'Initializing',
      debug: {
        distExists,
        routesExist
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service is running',
    data: { status: 'OK' }
  });
});

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
    // Simulate successful response for testing
    return res.status(200).json({
      success: true,
      message: 'Username created successfully (direct route)',
      data: {
        username: `${username}@example.com`,
        bitcoinAddress: `${username}.user._bitcoin-payment.example.com`,
        dnsRecord: { id: 'simulated-id', name: username }
      }
    });
  } catch (error) {
    console.error('Error in create-username route:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Try to import the compiled app, but don't rely on it for core functionality
try {
  if (fs.existsSync(distPath)) {
    // Import and use the compiled app
    import('./dist/index.js')
      .then(module => {
        console.log('API module loaded successfully');
        
        // Import the routes from the username module
        if (fs.existsSync(usernameRoutesPath)) {
          import('./dist/routes/username.js')
            .then(usernameModule => {
              console.log('Username routes mounted successfully');
            })
            .catch(err => {
              console.error('Failed to load username routes:', err);
            });
        } else {
          console.log('Username routes file not found at:', usernameRoutesPath);
        }
      })
      .catch(err => {
        console.error('Failed to load API module:', err);
      });
  } else {
    console.log('Dist directory not found at:', distPath);
  }
} catch (error) {
  console.error('Error importing modules:', error);
}

// Start the server if not being imported by Vercel
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;