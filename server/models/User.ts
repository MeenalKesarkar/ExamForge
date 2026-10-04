import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ======================================================
// USER ROLE
// ======================================================

export type UserRole =
  | "student"
  | "instructor"
  | "admin";

// ======================================================
// ACCOUNT STATUS
// ======================================================

export type AccountStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

// ======================================================
// TEACHING ASSIGNMENT
// ======================================================

export interface TeachingAssignment {
  subject: string;
  degree: string;
  yearOfStudy: number;
  semesters: number[];
  classSections: string[];
}

// ======================================================
// USER INTERFACE
// ======================================================

export interface IUser
  extends Document {
  name: string;
  email: string;
  passwordHash: string;

  role: UserRole;

  accountStatus: AccountStatus;

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
  isGraduated: boolean;
  graduatedAt?: Date;
  graduatedBy?: mongoose.Types.ObjectId;

  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ======================================================
// TEACHING ASSIGNMENT SCHEMA
// ======================================================

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
          validator: (
            value: number[]
          ) =>
            Array.isArray(value) &&
            value.length > 0 &&
            value.every(
              (semester) =>
                [1, 2, 3, 4, 5, 6].includes(
                  semester
                )
            ),

          message:
            "At least one valid semester is required",
        },
      },

      classSections: {
        type: [String],
        required: true,

        validate: {
          validator: (
            value: string[]
          ) =>
            Array.isArray(value) &&
            value.length > 0 &&
            value.every(
              (section) =>
                Boolean(section.trim())
            ),

          message:
            "At least one class section is required",
        },
      },
    },

    {
      _id: false,
    }
  );

// ======================================================
// USER SCHEMA
// ======================================================

const userSchema =
  new Schema<IUser>(
    {
      // --------------------------------------------------
      // BASIC INFORMATION
      // --------------------------------------------------

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

      // --------------------------------------------------
      // ROLE
      // --------------------------------------------------

      role: {
        type: String,

        enum: [
          "student",
          "instructor",
          "admin",
        ],

        required: true,

        default: "student",
      },

      // --------------------------------------------------
      // ACCOUNT STATUS
      // --------------------------------------------------
      //
      // New student/instructor registrations should be
      // pending until an admin approves them.
      //
      // Admin accounts should be created as approved.
      // --------------------------------------------------

      accountStatus: {
        type: String,

        enum: [
          "pending",
          "approved",
          "rejected",
          "suspended",
        ],

        required: true,

        default: "pending",
      },

      // --------------------------------------------------
      // STUDENT INFORMATION
      // --------------------------------------------------

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

      // --------------------------------------------------
      // INSTITUTION
      // --------------------------------------------------

      institution: {
        type: String,
        trim: true,
        maxlength: 150,
      },

      // --------------------------------------------------
      // INSTRUCTOR TEACHING ASSIGNMENTS
      // --------------------------------------------------

      teachingAssignments: {
        type: [
          teachingAssignmentSchema,
        ],

        default: [],
      },

      // --------------------------------------------------
      // PROFILE INFORMATION
      // --------------------------------------------------

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

      // --------------------------------------------------
      // ACCOUNT ENABLE / DISABLE
      // --------------------------------------------------

      isActive: {
        type: Boolean,
        default: true,
        required: true,
      },

      isGraduated: {
        type: Boolean,
        default: false,
        required: true,
      },

      graduatedAt: {
        type: Date,
      },

      graduatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      // --------------------------------------------------
      // APPROVAL INFORMATION
      // --------------------------------------------------

      approvedAt: {
        type: Date,
      },

      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      rejectionReason: {
        type: String,
        trim: true,
        maxlength: 500,
      },
    },

    {
      collection: "users",
      timestamps: true,
    }
  );

// ======================================================
// STUDENT ID INDEX
// ======================================================

userSchema.index(
  {
    studentId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

// ======================================================
// USER MODEL
// ======================================================

const User =
  mongoose.models.User ||
  mongoose.model<IUser>(
    "User",
    userSchema
  );

export default User;
