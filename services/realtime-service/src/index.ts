import { KafkaEngine } from "@empire/shared";
import { createAdapter } from "@socket.io/redis-adapter";
import express from "express";
import { createServer } from "http";
import { createClient } from "redis";
import { Server, Socket } from "socket.io";
const app = express();

const http = createServer(app);

const io = new Server(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT"],
  },
});

interface CustomSocket extends Socket {
  userId?: string;
}
const bootRealTimeEngine = async () => {
  try {
    const pubClient = createClient({ url: "redis://empire-redis:6379" });
    const subClient = pubClient.duplicate();
    pubClient.on("error", (err) =>
      console.error("Redis Pub Client Error:", err),
    );
    subClient.on("error", (err) =>
      console.error("Redis Sub Client Error:", err),
    );

    Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    io.on("connection", (socket: CustomSocket) => {
      socket.on("authenticate", (userId: string) => {
        socket.join(userId);
        socket.userId = userId;
        console.log(`Socket ID: ${socket.id} joined room ${userId}`);
      });
      socket.on("disconnect", () => {
        console.log(`User: ${socket.userId} disconnected`);
      });
    });

    http.listen(4002, () => {
      console.log(
        "Realtime Websockets cleanly listening on http://localhost:4002",
      );
    });
    await attachListener(io);
  } catch (error) {
    console.error("error in bootrealengine: ", error);
    process.exit(1);
  }
};

async function attachListener(io: Server) {
  const kafka = await KafkaEngine.getInstance();
  const consumer = kafka.consumer({ groupId: "realtime-group" });

  let isConnected = false;

  while (!isConnected) {
    try {
      await consumer.connect();
      await consumer.subscribe({
        topic: "order.created",
        fromBeginning: false,
      });

      console.log(
        `✅ realtime-group consumer successfully synchronized and subscribed`,
      );
      isConnected = true;
    } catch (error: any) {
      console.warn("⚠️ Kafka Metadata initializing. Retrying in 3 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  await consumer.run({
    eachMessage: async ({ message }) => {
      const rawPayload = message.value?.toString();
      if (!rawPayload) return;
      const eventData = JSON.parse(rawPayload);
      console.log(`📥 Payload received of:`, eventData);

      io.to(eventData.userId).emit("order_update", {
        type: "ORDER_CREATED",
        message: "Your order has been placed",
        data: eventData,
      });
    },
  });
}

bootRealTimeEngine();
