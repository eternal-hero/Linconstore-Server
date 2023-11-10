import mongoose from "mongoose";

export interface IRefund extends mongoose.Document{
    userId: mongoose.Types.ObjectId,
    storeId: mongoose.Types.ObjectId,
    productId: mongoose.Types.ObjectId,
    reason: string,
    status: string
}

const refundSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Types.ObjectId,
        required : true,
        ref: 'User'
    },
    storeId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Store'
    },
    productId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        trim: true,
        default: 'pending'
    }

}, {
    timestamps: true
})

refundSchema.index({productId: 1, userId: 1}, {name: 'unique_index_name', unique: true});
 const Refund = mongoose.model<IRefund>('refund', refundSchema)
export default Refund