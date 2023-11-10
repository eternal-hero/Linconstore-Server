import mongoose from "mongoose";
export interface IShipping extends mongoose.Document {
    price : number,
    storeId : mongoose.Schema.Types.ObjectId
}
const shippingSchema = new mongoose.Schema({
    price : {
        type: Number,
        required: true,
    },
    storeId : {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'seller'
    }
}, {
    timestamps: true
})

const Shipping = mongoose.model<IShipping>('shipping', shippingSchema)

export default Shipping;