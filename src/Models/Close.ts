import mongoose from "mongoose";
import exp from "constants";

interface IClose extends  mongoose.Document{
    reason: string,
    comment: string
}

const closeSchema = new mongoose.Schema({
        reason : {
            required: true,
            type: String,
            minLength: 4,
            trim: true
        },
        comment: {
            required: true,
            type: String,
            minLength: 4,
            trim: true
        }
})

const Close = mongoose.model<IClose>('close', closeSchema);
export default  Close;