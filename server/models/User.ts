import mongoose, {
  Document,
  Schema,
} from "mongoose";

export type UserRole =
  | "student"
  | "instructor";

export interface IUser
  extends Document {
  name: string;
  email: string;
  passwordHash: string;

  role: UserRole;

  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  studentId?: string;

  phone?: string;
  city?: string;
  bio?: string;

  profilePicture?: string | null;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema =
  new Schema<IUser>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 150,
      },

      passwordHash: {
        type: String,
        required: true,
      },

      role: {
        type: String,
        enum: [
          "student",
          "instructor",
        ],
        required: true,
        default: "student",
      },

      degree: {
        type: String,
        trim: true,
        default: "BCA",
      },

      yearOfStudy: {
        type: Number,
        min: 1,
        max: 3,
      },

      semester: {
        type: Number,
        min: 1,
        max: 6,
      },

      studentId: {
        type: String,
        trim: true,
        maxlength: 50,
      },

      phone: {
        type: String,
        trim: true,
        maxlength: 20,
      },

      city: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      bio: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      profilePicture: {
        type: String,
        default: null,
      },

      isActive: {
        type: Boolean,
        default: true,
        required: true,
      },
    },

    {
      collection: "users",
      timestamps: true,
    }
  );

userSchema.index(
  {
    studentId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

const User =
  mongoose.models.User ||
  mongoose.model<IUser>(
    "User",
    userSchema
  );

export default User;