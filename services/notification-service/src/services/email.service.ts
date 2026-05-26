import nodemailer from "nodemailer";
export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mailpit",
    port: Number(process.env.SMTP_PORT) || 1025,
    ignoreTLS: true,
    secure: false,
  });

  static async sendOrderConfirmation(
    email: string,
    orderId: string,
    amount: number,
  ) {
    const info = await this.transporter.sendMail({
      from: '"Empire Store" <noreply@mpire.com>',
      to: email,
      subject: `Order Confirmation ${orderId}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Order ID: <strong>${orderId}</strong></p>
        <p>Total Amount: <strong>$${amount}</strong></p>
        <p>We are processing your order and will notify you when it ships.</p>
      `,
    });
    console.log(`Email sent to ${email} (Mailpit ID: ${info.messageId})`);
  }
}
