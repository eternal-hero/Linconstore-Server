import mongoose from "mongoose";
import {TVariant} from "./Cart";

export interface IWish extends mongoose.Document{
    userId : mongoose.Types.ObjectId,
    productId: mongoose.Types.ObjectId,
    variants: TVariant[],
    price: number

}
const wishSchema = new mongoose.Schema({
    userId :{
        type: mongoose.Types.ObjectId,
        required: true,
        ref : 'User'
    },
    productId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
    variants: [{
        option: String,
        variant : String
    }],
    price: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
})
// wishSchema.index({userId:1, productId: 1}, {unique: true})
const Wish = mongoose.model<IWish>('wish',wishSchema)

export default Wish;