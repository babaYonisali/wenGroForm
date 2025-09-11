const mongoose = require('mongoose');

const connectDB = () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10
  });

  const db = mongoose.connection;
  
  db.on('error', (error) => console.error('❌ MongoDB connection error:', error));
  db.on('connected', () => console.log('✅ Connected to MongoDB'));
  db.on('disconnected', () => console.log('❌ Disconnected from MongoDB'));
  db.once('open', () => console.log('🚀 MongoDB connection established'));

  return db;
};

module.exports = connectDB;
