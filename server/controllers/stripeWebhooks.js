import Stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";

export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("✅ Event:", event.type);
  } catch (error) {
    console.log("❌ Signature Error:", error.message);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        console.log("Payment Intent:", paymentIntent.id);

        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        console.log("Session List:", sessionList.data);

        if (sessionList.data.length === 0) {
          console.log("❌ No checkout session found.");
          break;
        }

        const session = sessionList.data[0];

        console.log("Session Metadata:", session.metadata);

        const bookingId = session.metadata.bookingId;

        console.log("Booking ID:", bookingId);

        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            isPaid: true,
            paymentLink: "",
          },
          { new: true }
        );

        console.log("Updated Booking:", updatedBooking);

        if (updatedBooking) {
          await inngest.send({
            name: "/api/show.booked",
            data: { bookingId },
          });
        }

        break;
      }

      default:
        console.log("Unhandled Event:", event.type);
    }

    response.json({ received: true });
  } catch (err) {
    console.error("Webhook Processing Error:", err);
    response.status(500).send("Internal Server Error");
  }
};