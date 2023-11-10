import mongoose from "mongoose";
const objectId = mongoose.Types.ObjectId;

export interface IReplyContact extends mongoose.Document {
  contactId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const replyContactSchema = new mongoose.Schema(
  {
    contactId: {
      type: objectId,
      required: [true, "This is required"],
      ref: "contact",
    },
    title: {
      type: String,
      required: true,
      minLength: [4, "Must be a least 4 Characters"],
    },
    message: {
      type: String,
      required: true,
      minLength: [4, "Must be a least 4 Characters"],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ReplyContact = mongoose.model<IReplyContact>("replyContact", replyContactSchema);
export default ReplyContact;
