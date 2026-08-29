const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI in the environment.
 * Exits the process on failure so the app never runs without a DB.
 */
async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not set. Please configure your .env file.');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err.message);
  });
}

module.exports = connectDatabase;
