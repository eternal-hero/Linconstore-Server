import mongoose from "mongoose";
const objectId = mongoose.Types.ObjectId;
export interface IInvoiceDownload extends mongoose.Document {
  userId: typeof objectId;
  orderId: typeof objectId;
}
const invoiceDownloadSchema = new mongoose.Schema(
  {
    userId: {
      required: true,
      ref: "User",
      type: objectId,
    },
    orderId: {
      required: true,
      ref: "Order",
      type: objectId,
    },
  },
  {
    timestamps: true,
  }
);

const InvoiceDownload = mongoose.model<IInvoiceDownload>("invoiceDownload", invoiceDownloadSchema);

export default InvoiceDownload;
