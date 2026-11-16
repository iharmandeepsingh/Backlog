const mongoose = require('mongoose');
const dbStore = require('../utils/dbStore');

let isMongooseConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('📦 Using Built-in Persistent JSON Store (backend/data/)');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    isMongooseConnected = true;
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection failed (${error.message}). Falling back to Persistent JSON Store.`);
    isMongooseConnected = false;
    return false;
  }
};

const getDB = () => {
  return dbStore;
};

module.exports = { connectDB, getDB, isMongooseConnected: () => isMongooseConnected };
