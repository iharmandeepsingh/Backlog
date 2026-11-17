const mongoose = require('mongoose');

let isMongooseConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://harmanprab_db_user:NMnoIC7wmIPMdiLj@cluster0.lqzqt8a.mongodb.net/backlog_exam_portal?retryWrites=true&w=majority';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 1,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority'
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
    isMongooseConnected = true;
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    isMongooseConnected = false;
    throw error;
  }
};

mongoose.connection.on('error', (err) => {
  console.warn('⚠️ MongoDB connection notice:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Mongoose will automatically reconnect.');
  isMongooseConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB Atlas reconnected successfully.');
  isMongooseConnected = true;
});

module.exports = {
  connectDB,
  isMongooseConnected: () => isMongooseConnected
};
