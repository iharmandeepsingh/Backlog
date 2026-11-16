const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./src/config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded receipts statically
const uploadPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadPath, {
  setHeaders: (res, filePath) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/config', require('./src/routes/configRoutes'));
app.use('/api/sessions', require('./src/routes/sessionRoutes'));
app.use('/api/subjects', require('./src/routes/subjectRoutes'));
app.use('/api/registrations', require('./src/routes/registrationRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Backlog Examination Registration Portal API',
    timestamp: new Date().toISOString()
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'University Backlog Examination Registration Portal API',
    documentation: '/api/health',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize and Start Server
const startServer = async () => {
  try {
    await connectDB();
    
    // Auto-seed if data directory is empty
    const { User } = require('./src/models');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('ℹ️ No user records found. Auto-running database seed...');
      const seedDatabase = require('./scripts/seed');
      await seedDatabase();
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Backlog Exam Portal Backend running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${PORT} is already in use by another running server.`);
        console.error(`   To free port ${PORT} on Windows PowerShell, run:`);
        console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue).OwningProcess -Force`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
