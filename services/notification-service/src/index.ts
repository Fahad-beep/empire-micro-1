import { ConsumerService } from "./services/consumer.service.js";

const startService = async () => {
  try {
    console.log("Booting Notification Worker...");
    await ConsumerService.startConsuming();
    console.log(`started consuming`);
  } catch (error) {
    console.error("Fatal Worker Error:", error);
    process.exit(1);
  }
};

await startService();
