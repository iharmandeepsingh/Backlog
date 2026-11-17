const mongoose = require('mongoose');

let isMongooseConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://harmanprab_db_user:NMnoIC7wmIPMdiLj@cluster0.lqzqt8a.mongodb.net/backlog_exam_portal?retryWrites=true&w=majority';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
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

module.exports = {
  connectDB,
  isMongooseConnected: () => isMongooseConnected
};
