import express from 'express';
import cors from 'cors';
import config, { validateConfig } from './config.js';
import usernameRoutes from './routes/username.js';

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'https://shopstr-gl.vercel.app', 'https://nitishjha.space'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bitcoin Username API',
    data: {
      version: '1.0.0',
      endpoints: [
        { path: '/create-username', method: 'POST', description: 'Create a new username with a BOLT12 offer' },
        { path: '/health', method: 'GET', description: 'Check if the API is running' }
      ]
    }
  });
});

// Routes
app.use('/', usernameRoutes);

// Start server with port fallback
const startServer = (port: number, maxAttempts = 3, attempt = 1) => {
  try {
    const server = app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      
      // Validate configuration
      if (!validateConfig()) {
        console.warn('⚠️ API running with missing configuration. Some features may not work correctly.');
        console.warn('   Check .env.example for required environment variables.');
      }
    });

    // Handle server errors
    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} is already in use.`);
        
        if (attempt < maxAttempts) {
          const nextPort = port + 1;
          console.log(`Trying port ${nextPort}...`);
          startServer(nextPort, maxAttempts, attempt + 1);
        } else {
          console.error(`❌ Could not find an available port after ${maxAttempts} attempts.`);
          console.error('Please manually specify a different port using the PORT environment variable.');
          process.exit(1);
        }
      } else {
        console.error('Server error:', e);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start with configured port
startServer(config.port);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;