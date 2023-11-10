import mongoose from "mongoose";
import SubCategory from "./SubCategory";

type category = {
    subcategories : string
}
export interface ICategory extends mongoose.Document{
    title : string,
    link: string,
    subcategory : category[]
}

const categorySchema = new mongoose.Schema({
    title : {
        type : String,
        required : true
    },
    link: {
        type: String,
        required: true
    },
    subcategories : [{
            type: String,
            required: true
    }]
}, {
    timestamps: true
})



const Category = mongoose.model<ICategory>('category', categorySchema)

export default Category;