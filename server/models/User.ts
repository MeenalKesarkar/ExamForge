import mongoose, {
  Document,
  Schema,
} from "mongoose";

export type UserRole =
  | "student"
  | "instructor";

export interface TeachingAssignment {
  subject: string;
  degree: string;
  yearOfStudy: number;
  semesters: number[];
  classSections: string[];
}

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
  classSection?: string;

  institution?: string;
  teachingAssignments?: TeachingAssignment[];

  phone?: string;
  city?: string;
  bio?: string;

  profilePicture?: string | null;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const teachingAssignmentSchema =
  new Schema<TeachingAssignment>(
    {
      subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      degree: {
        type: String,
        required: true,
        trim: true,
        default: "BCA",
        maxlength: 50,
      },

      yearOfStudy: {
        type: Number,
        required: true,
        min: 1,
        max: 3,
      },

      semesters: {
        type: [Number],
        required: true,
        validate: {
          validator: (value: number[]) =>
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((semester) =>
              [1, 2, 3, 4, 5, 6].includes(semester)
            ),
          message: "At least one valid semester is required",
        },
      },

      classSections: {
        type: [String],
        required: true,
        validate: {
          validator: (value: string[]) =>
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((section) => Boolean(section.trim())),
          message: "At least one class section is required",
        },
      },
    },
    { _id: false }
  );

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

      classSection: {
        type: String,
        trim: true,
        maxlength: 20,
      },

      institution: {
        type: String,
        trim: true,
        maxlength: 150,
      },

      teachingAssignments: {
        type: [teachingAssignmentSchema],
        default: [],
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
