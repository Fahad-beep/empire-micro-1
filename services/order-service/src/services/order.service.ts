import mongoose from "mongoose";
import { Order, type OrderDocument } from "../models/Order.js";
import { Outbox } from "../models/Outbox.js";
import { KafkaEngine } from "@empire/shared";
export class OrderService {
  static async createOrder(
    userId: string,
    totalAmount: number,
  ): Promise<OrderDocument> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const [order] = await Order.create(
        [
          {
            userId,
            totalAmount,
            status: "PENDING",
          },
        ],
        {
          session,
        },
      );
      if (!order) {
        throw new Error("Failed to initialize order document.");
      }

      const eventPayload = JSON.stringify({
        orderId: order?.id,
        userId: order?.userId,
        amount: order?.totalAmount,
      });

      await Outbox.create([
        {
          payload: eventPayload,
          type: "order.created",
          status: "PENDING",
        },
      ]);

      await session.commitTransaction();

      // this.publishPendingEvents().catch((err) =>
      //   console.error("Immediate publish failed, poller will catch it", err),
      // );
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // static async publishPendingEvents() {
  //   const producer = await KafkaEngine.getProducer();
  //   const pendingEvents = await Outbox.find({ status: "PENDING" });

  //   for (const event of pendingEvents) {
  //     try {
  //       await producer.send({
  //         topic: event.topic,
  //         messages: [
  //           {
  //             key: event.id,
  //             value: event.payload,
  //           },
  //         ],
  //       });

  //       event.status = "PUBLISHED";
  //       await event.save();
  //       console.log(
  //         `Successfully published event ${event.id} to Kafka topic ${event.topic}`,
  //       );
  //     } catch (error) {
  //       console.error(
  //         `Failed to publish event ${event.id}. Will retry on next poll.`,
  //       );
  //     }
  //   }
  // }
}
