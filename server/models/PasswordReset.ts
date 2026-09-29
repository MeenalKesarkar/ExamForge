import mongoose, { Schema, Document } from "mongoose";

export interface IPasswordReset extends Document {
  userId?: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  verifiedAt: Date | null;
  resetToken: string | null;
  resetTokenExpiresAt: Date | null;
}

const passwordResetSchema =
  new Schema<IPasswordReset>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
        index: true,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
      },

      otpHash: {
        type: String,
        required: true,
      },

      expiresAt: {
        type: Date,
        required: true,
      },

      attempts: {
        type: Number,
        default: 0,
        min: 0,
      },

      verified: {
        type: Boolean,
        default: false,
      },

      verifiedAt: {
        type: Date,
        default: null,
      },

      resetToken: {
        type: String,
        default: null,
      },

      resetTokenExpiresAt: {
        type: Date,
        default: null,
      },
    },
    {
      collection: "password_resets",
      timestamps: true,
    }
  );

// Automatically delete expired password reset records
passwordResetSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const PasswordReset =
  mongoose.model<IPasswordReset>(
    "PasswordReset",
    passwordResetSchema
  );

export default PasswordReset;