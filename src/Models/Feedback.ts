import mongoose from "mongoose";
import * as validator from "validator";
const objectId = mongoose.Types.ObjectId;

export interface IFeedback extends mongoose.Document {
    user: mongoose.Types.ObjectId;
    message: string,
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
const feedbackSchema = new mongoose.Schema(
    {
        user: {
            type: objectId,
            required: [true, "This is required"],
            ref: "user",
        },
        message: {
            required: true,
            type: String,
            trim: true,
            minLength: [10, 'Message must be at least 10 characters']
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
)

const Feedback = mongoose.model<IFeedback>('feedback', feedbackSchema);
export default Feedback;