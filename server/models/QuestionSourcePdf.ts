import mongoose, { Document, Schema } from "mongoose";

export interface IQuestionSourcePdf extends Document {
  ownerId: mongoose.Types.ObjectId;
  originalName: string;
  sha256: string;
  contentType: string;
  size: number;
  data: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const questionSourcePdfSchema = new Schema<IQuestionSourcePdf>({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  originalName: { type: String, required: true, maxlength: 255 },
  sha256: { type: String, required: true, maxlength: 64 },
  contentType: { type: String, required: true, default: "application/pdf" },
  size: { type: Number, required: true, min: 1 },
  data: { type: Buffer, required: true },
}, { collection: "question_source_pdfs", timestamps: true });

questionSourcePdfSchema.index({ ownerId: 1, sha256: 1 }, { unique: true });
questionSourcePdfSchema.index({ ownerId: 1, updatedAt: -1 });

const QuestionSourcePdf = mongoose.models.QuestionSourcePdf ||
  mongoose.model<IQuestionSourcePdf>("QuestionSourcePdf", questionSourcePdfSchema);

export default QuestionSourcePdf;
