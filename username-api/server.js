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
    
    // Import the routes from the username module
    import('./dist/routes/username.js')
      .then(usernameModule => {
        // Mount the username routes
        app.use('/', usernameModule.default);
        console.log('Username routes mounted successfully');
      })
      .catch(err => {
        console.error('Failed to load username routes:', err);
      });
  })
  .catch(err => {
    console.error('Failed to load API module:', err);
  });

// Start the server if not being imported by Vercel
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;