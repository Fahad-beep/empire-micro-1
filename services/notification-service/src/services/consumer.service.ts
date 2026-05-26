import { KafkaEngine } from "@empire/shared";
import { EmailService } from "./email.service.js";

export class ConsumerService {
  static async startConsuming() {
    const kafka = KafkaEngine.getInstance();
    const consumer = kafka.consumer({
      groupId: "notification-group",
    });

    await consumer.connect();
    console.log("notification consumer connected");

    let retries = 5;
    let subscribed = false;
    while (!subscribed && retries >= 0) {
      try {
        await consumer.subscribe({
          topic: "order.created",
          fromBeginning: true,
        });
        subscribed = true;
        console.log("successfully subscribed to order.created");
      } catch (error: any) {
        if (error.type === "UNKNOWN_TOPIC_OR_PARTITION" || error.code === 3) {
          console.warn(`Kafka Metadata not fully initialized yet. Retrying...`);
          retries--;
          await new Promise((res) => setTimeout(res, 3000));
        } else {
          throw error;
        }
      }
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        const rawPayload = message.value?.toString();
        if (!rawPayload) return;
        console.log("rawPayload__: ", rawPayload);

        let attempt = 0;
        let maxTries = 3;

        while (attempt < maxTries) {
          try {
            attempt++;
            const rootEnvelope = JSON.parse(rawPayload);
            const dataEnvelope = rootEnvelope.payload;

            if (!dataEnvelope) {
              throw new Error(
                "Invalid Debezium message envelope structural layout.",
              );
            }

            const eventData =
              typeof dataEnvelope.payload === "string"
                ? JSON.parse(dataEnvelope.payload)
                : dataEnvelope;

            console.log(
              `[Processing] Order ${eventData.orderId}, User: ${eventData.userId}, Attempt ${attempt}`,
            );

            const userEmail = `${eventData.userId}@example.com`;

            // Simulating dependency instability
            if (Math.random() < 0.3) {
              throw new Error("Simulated Network Timeout to Mail Server");
            }

            await EmailService.sendOrderConfirmation(
              userEmail,
              eventData.orderId,
              eventData.amount,
            );

            return; // Success Path: Message finalized!
          } catch (error: any) {
            console.warn(
              `[Warning] Attempt ${attempt} failed: ${error.message}`,
            );
            await heartbeat(); // Keep consumer active

            if (attempt >= maxTries) {
              console.log(
                `Poison Pill Detected. Initializing Fresh DLQ Producer...`,
              );

              const dlqProducer = kafka.producer();
              await dlqProducer.connect();

              try {
                await dlqProducer.send({
                  topic: "dlq.notifications",
                  messages: [
                    {
                      key: message.key,
                      value: rawPayload,
                      headers: {
                        originalTopic: topic,
                        error: error.message,
                      },
                    },
                  ],
                });
                console.log(`Sent to DLQ successfully.`);
              } finally {
                await dlqProducer.disconnect();
              }

              console.log(`[Commit] Advancing message index tracking bounds.`);
              return;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      },
    });
  }
}
