import dns from "dns";

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import User from "../models/User";
import Question from "../models/Question";

dotenv.config();