import { Schema, model, type HydratedDocument } from "mongoose";

export interface IOrder {
  userId: string;
  totalAmount: number;
  status: string;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "SHIPPED"],
      default: "PENDING",
    },
  },
  { timestamps: true, collection: "Order" },
);

export const Order = model<IOrder>("Order", orderSchema);
export type OrderDocument = HydratedDocument<IOrder>;
