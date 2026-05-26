import express from "express";
import mongoose from "mongoose";
import { OrderService } from "./services/order.service.js";
import { KafkaEngine } from "@empire/shared";

const app = express();
app.use(express.json());

app.post("/api/checkout", async (req, res) => {
  try {
    const { userId, totalAmount } = req.body;
    const order = await OrderService.createOrder(userId, totalAmount);

    res.status(201).json({
      status: "success",
      message: "Order placed successfully. Processing in background.",
      orderId: order.id,
    });
  } catch (error: any) {
    console.error("Checkout Error:", error.message);
    res
      .status(500)
      .json({ status: "error", message: "Checkout failed. Please try again." });
  }
});

const startServer = async () => {
  try {
    console.log(`starting server: `, process.env.MONGO_URI);
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb://localhost:27017/empire_orders?replicaSet=rs0",
    );
    console.log("MongoDB Connected (Replica Set Active)");

    await KafkaEngine.getProducer();

    app.listen(4001, () => {
      console.log("Order Service running on http://localhost:4001");
    });

    // setInterval(() => {
    //   OrderService.publishPendingEvents().catch(console.error);
    // }, 10000);
  } catch (error) {
    console.error("Failed to start Order Service:", error);
    process.exit(1);
  }
};

await startServer();
