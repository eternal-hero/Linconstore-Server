import mongoose from "mongoose";

export interface IReport extends mongoose.Document{
    _id: mongoose.Types.ObjectId,
    productId : mongoose.Types.ObjectId,
    reason: string,
    owner: mongoose.Types.ObjectId,
    reportAmount: number,
}
const ratingSchema = new mongoose.Schema({
    productId : {
        type: mongoose.Types.ObjectId,
        ref : 'Product'
    },    
    reason: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref : 'User'
    },
    reportAmount: {
        type: Number,
        default: 1,
    }
})

const Report = mongoose.model<IReport>('Report', ratingSchema)

export default Report;