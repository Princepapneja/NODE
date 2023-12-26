import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`, {
      dbName: process.env.DB_NAME,
    
    });

    console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    // If the error is due to the database not existing, create it
    if (error.message.includes("database")) {
      try {
        const adminConnection = await mongoose.createConnection(`${process.env.MONGODB_URI}`);

        const adminDb = adminConnection.db;
        await adminDb.createDatabase(process.env.DB_NAME);

        console.log(`Database "${process.env.DB_NAME}" created successfully!`);
        await connectDB();
      } catch (createError) {
        console.log("Failed to create database:", createError);
        process.exit(1);
      }
    } else {
      console.log("MONGODB connection FAILED ", error);
      process.exit(1);
    }
  }
};

export default connectDB;
