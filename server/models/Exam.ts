import mongoose, { Document, Schema } from "mongoose";
export interface IExam extends Document {
    title: string;
    subject?: string;
    degree?: string;
    yearOfStudy?: number;
    semester?: number;
    duration: number;
    questionCount: number;
    totalMarks: number;
    passingMarks: number;
    negativeMarking: boolean;
    negativePenalty: number;
    allowedAttempts: number;
    startDate?: Date;
    endDate?: Date;
    instructions: string[];
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    published: boolean;
    resultsHidden: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
const examSchema = new Schema<IExam>({
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    subject: { type: String, trim: true, maxlength: 150, default: "" },
    degree: { type: String, trim: true, default: "BCA" },
    yearOfStudy: { type: Number, min: 1, max: 3, required: false },
    semester: { type: Number, min: 1, max: 6, required: false },
    duration: { type: Number, required: true, min: 1 },
    questionCount: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 0 },
    passingMarks: { type: Number, required: true, min: 0 },
    negativeMarking: { type: Boolean, default: false },
    negativePenalty: { type: Number, default: 0, min: 0 },
    allowedAttempts: { type: Number, default: 1, min: 1, max: 1 },
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    instructions: { type: [String], default: [] },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    published: { type: Boolean, default: false, index: true },
    resultsHidden: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { collection: "exams", timestamps: true });
examSchema.index({ createdBy: 1, createdAt: -1 });
examSchema.index({ published: 1, degree: 1, yearOfStudy: 1, semester: 1 });
examSchema.index({ startDate: 1, endDate: 1 });
const Exam = mongoose.models.Exam || mongoose.model<IExam>("Exam", examSchema);
export default Exam;
