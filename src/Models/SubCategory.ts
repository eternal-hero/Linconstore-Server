import mongoose from "mongoose";


interface IsubCategory {
    title : string
}
const subCategorySchema = new mongoose.Schema({
    title : {
        type : String,
        ref : 'subCategory'
    }
})

const SubCategory = mongoose.model<IsubCategory>('subcategory', subCategorySchema);

export default SubCategory;