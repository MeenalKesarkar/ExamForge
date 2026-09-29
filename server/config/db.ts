import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not defined in .env"
      );
    }

    const connection =
      await mongoose.connect(
        process.env.MONGO_URI,
        {
          dbName: "ExamForge",
        }
      );

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error instanceof Error
        ? error.message
        : error
    );

    process.exit(1);
  }
};

export default connectDB;