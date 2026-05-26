import { Schema, model, type HydratedDocument } from "mongoose";

export interface IOutbox {
  type: string;
  payload: string;
  status: string;
  createdAt: Date;
}

const outboxSchema = new Schema<IOutbox>(
  {
    type: { type: String, required: true },
    payload: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PUBLISHED", "FAILED"],
      default: "PENDING",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: "5m" },
    },
  },
  { timestamps: true, collection: "Outbox" },
);

export const Outbox = model("Outbox", outboxSchema);
export type OutboxDocument = HydratedDocument<typeof Outbox>;
