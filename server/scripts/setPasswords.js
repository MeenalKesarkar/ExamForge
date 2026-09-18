const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("../models/User");

dotenv.config();

const setPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "ExamForge",
    });

    console.log("MongoDB connected");

    const instructorPassword = "Priya@123";
    const studentPassword = "Rahul@123";

    const instructorHash = await bcrypt.hash(instructorPassword, 10);
    const studentHash = await bcrypt.hash(studentPassword, 10);

    await User.updateOne(
      { email: "priya.instructor@example.com" },
      { $set: { passwordHash: instructorHash } }
    );

    await User.updateOne(
      { email: "rahul.student@example.com" },
      { $set: { passwordHash: studentHash } }
    );

    console.log("Passwords updated successfully");

    console.log(
      "Instructor: priya.instructor@example.com / Priya@123"
    );

    console.log(
      "Student: rahul.student@example.com / Rahul@123"
    );

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

setPasswords();