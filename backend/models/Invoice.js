import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    
    // Detailed Billing Sections
    parts: [
      {
        partId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        priceSnapshot: { type: Number, required: true }, 
        total: { type: Number, required: true },
      },
    ],
    
    services: [
      {
        serviceCatalogId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCatalog" },
        name: { type: String, required: true },
        priceSnapshot: { type: Number, required: true }, 
        total: { type: Number, required: true },
      },
    ],

    labor: {
      typeOfWork: { type: String },
      priceSnapshot: { type: Number, default: 0 },
    },

    // Calc Fields
    subTotal: { type: Number, required: true },
    gst: { type: Number, required: true, default: 0 }, // 18% etc.
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    status: {
      type: String,
      enum: ["Draft", "Sent", "Paid", "Partially Paid", "Overdue", "Cancelled", "Finalized"],
      default: "Draft",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Transfer", "None"],
      default: "None",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    paidAt: Date,
    finalizedAt: Date,

    // 📄 Server-generated PDF
    pdfUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;