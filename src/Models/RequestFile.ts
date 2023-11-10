import mongoose from "mongoose";
export interface IRequestFile extends mongoose.Document{
    sellerId : mongoose.Types.ObjectId,
    message: string,
    link: string
}

const requestFileSchema = new mongoose.Schema({
    sellerId : {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Seller'
    },
    message: {
        type: String,
        required: true,
        trim: true
    }
})

const RequestFile  = mongoose.model<IRequestFile>('requests', requestFileSchema);

export default RequestFile