import { Kafka, logLevel, type Producer } from "kafkajs";

export class KafkaEngine {
  private static instance: Kafka;
  private static producer: Producer;
  private static isConnected: boolean = false;

  static getInstance(): Kafka {
    const broker = process.env.BOOTSTRAP_SERVERS;
    console.log("--- SHARED ENGINE RUNTIME HOOK ---");
    console.log("READING BOOTSTRAP_SERVERS AT RUNTIME:", broker);
    console.log("----------------------------------");
    if (!this.instance) {
      this.instance = new Kafka({
        brokers: broker ? [broker] : ["localhost:9092"],
        logLevel: logLevel.ERROR,
        clientId: "empire-core",
        retry: {
          initialRetryTime: 1000,
          retries: 30,
        },
      });
    }
    return this.instance;
  }

  static async getProducer() {
    if (!this.producer) {
      this.producer = this.getInstance().producer({
        idempotent: true,
      });
    }
    if (this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
      console.log(`Kafka Producer connected`);
    }
    return this.producer;
  }
}
