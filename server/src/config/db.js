const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn(`[MongoDB] Notice: MONGO_URI is not set in environment variables.`);
    console.warn(`[MongoDB] Running in memory-fallback mode. Quizzes from sampleQuiz.json are available!`);
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn(`[MongoDB] Server will continue running in memory mode so deployment stays healthy.`);
    return null;
  }
};

module.exports = connectDB;
