// This file helps Vercel properly route to the correct entry point
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Temporary routes while importing the main app
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bitcoin Username API',
    data: {
      version: '1.0.0',
      status: 'Initializing'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service is running',
    data: { status: 'OK' }
  });
});

// Import and use the compiled app
import('./dist/index.js')
  .then(module => {
    console.log('API module loaded successfully');
  })
  .catch(err => {
    console.error('Failed to load API module:', err);
  });

// Export for Vercel
export default app; 