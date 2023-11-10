import mongoose from "mongoose";

export interface IReview extends  mongoose.Document{
    rate : number,
    name : string,
    productId : mongoose.Types.ObjectId,
    owner : mongoose.Types.ObjectId,
    description: string
}

const reviewSchema = new  mongoose.Schema({
      rate : {
          type : Number,
          required : true
      },
     name : {
          required : true,
          type: String,
          trim : true,
         lowercase : true
     },
     productId : {
          type : mongoose.Types.ObjectId,
          ref : 'product',
          required : true
     },
    description: {
          type: String,
          required: true,
          trim: true
    },
     owner : {
          type: mongoose.Types.ObjectId,
         ref : 'Store',
         required: true
     }
})


const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;