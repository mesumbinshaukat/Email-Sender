import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // Do not exit in serverless environments (e.g., Vercel). Allow app to respond to health checks.
    // Optionally, you could re-attempt connection later or proceed with limited functionality.
  }
};

export default connectDB;
