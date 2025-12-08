require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

// Test logging configuration
console.log('\n=== Vipps Login Test Backend ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Server starting...\n');

// Log environment variables (without sensitive data)
console.log('Configuration:');
console.log(`- Port: ${PORT}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`- Vipps Client ID: ${process.env.VIPPS_CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
console.log(`- Vipps API Key: ${process.env.VIPPS_OCP_APIM_SUBSCRIPTION_KEY ? '✓ Set' : '✗ Missing'}`);
console.log('\n=== Available Endpoints ===');
console.log(`1. Health Check: http://localhost:${PORT}/auth/health`);
console.log(`2. Start Vipps Login: http://localhost:${PORT}/auth/vipps/login`);
console.log(`3. Session Check: http://localhost:${PORT}/auth/session/:sessionId`);
console.log('\n=== Server Logs ===');

// Add request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${req.method} ${req.originalUrl}`;
  console.log(logMessage);
  next();
});

const server = app.listen(PORT, () => {
  console.log('\n=== Server Started Successfully ===');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\nPress Ctrl+C to stop the server\n');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.log('Please either:');
    console.log(`1. Stop the other process using port ${PORT}, or`);
    console.log(`2. Set a different port in the .env file (e.g., PORT=3002)`);
  } else {
    console.error('\n❌ Server error:', error);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Server is shutting down...');
  server.close(() => {
    console.log('Server has been terminated.');
    process.exit(0);
  });
});

module.exports = server;
