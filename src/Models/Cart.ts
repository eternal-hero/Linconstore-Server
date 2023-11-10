import mongoose from "mongoose";
const objectID = mongoose.Types.ObjectId;

export type TVariant = {
    variant : string,
    option: string
}
export type TProduct = {
    productId : mongoose.Types.ObjectId,
    name : string,
    quantity : number,
    price : number,
    variants: TVariant[]
    photo: string
}
export interface ICart extends mongoose.Document{
    owner : mongoose.Types.ObjectId,
    products: TProduct [],
    bill : number
}
const cartSchema  = new mongoose.Schema({
    owner : {
        type : objectID,
        ref: 'User',
        unique: true,
        required: true
    },
    products: [{
        productId : {
            type: objectID,
            ref: 'Product',
            required: true
        },
        variants : [{
           option: String,
           variant: String
        }],
        name: String,
    quantity : {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
        price : Number,
        photo: String
    }],
    bill : {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
})


const Cart = mongoose.model<ICart>('cart', cartSchema)

export default Cart