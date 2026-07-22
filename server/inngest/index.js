import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js"
import Show from "../models/Show.js"
import sendEmail from "../config/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

//Inngest function to save user data to a database
const syncUserCreaton = inngest.createFunction(
   {
    id: "sync-user-from-clerk",
    triggers: [
      { event: "clerk/user.created" }
    ]
  },
    async ({ event }) => {
    try {
        console.log("User created event received");

        const {
            id,
            first_name,
            last_name,
            email_addresses,
            image_url
        } = event.data;

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: `${first_name} ${last_name}`,
            image: image_url,
        };

        await User.create(userData);

        console.log("User saved");
    } catch (err) {
        console.error(err);
        throw err;
    }
}
)

// inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
    {
    id: "delete-user-with-clerk",
    triggers: [
      { event: "clerk/user.deleted" }
    ]
  },
    async({event})=> {
        const {id} = event.data
        await User.findOneAndDelete(id)
    }
)

// inngest function to update user from database
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [
      { event: "clerk/user.updated" }
    ]
  },
  async ({ event }) => {
    const {
      id,
      first_name,
      last_name,
      email_addresses,
      image_url
    } = event.data;

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: `${first_name} ${last_name}`,
      image: image_url,
    };

    await User.findByIdAndUpdate(id, userData, { new: true });
  }
);

//inngest function to cancel booking and release seats of show after 10 minutes of booking created if payment is not done
const releaseSeatAndDeleteBooking = inngest.createFunction(
  {
    id: "release-seats-delete-booking",
    triggers: [
      { event: "app/checkpayment" }
    ]
  },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);

    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;

      const booking = await Booking.findById(bookingId);
      if (!booking || booking.isPaid) return;

      const show = await Show.findById(booking.show);
      if (!show) return;

      booking.bookedSeats.forEach((seat) => {
        delete show.occupiedSeats[seat];
      });

      show.markModified("occupiedSeats");
      await show.save();

      await Booking.findByIdAndDelete(booking._id);
    });
  }
);

//inngest function to send email when user books a show
const sendBookingConfirmationEmail = inngest.createFunction(
  {id: "send-booking-confirmation-email",
    triggers: [
      {event: "app/show.booked"}
    ]
  },
  async ({event, step}) => {
    const {bookingId} = event.data;

    const booking = await Booking.findById(bookingId).populate({
      path: 'show',
      populate: {path: 'movie', model: "Movie"}
    }).populate('user')

    await sendEmail({
      to: booking.user.email,
      subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
      body:`<div style="font-family: Arial, sans-serif; line-height: 1.5; ">
      <h2>Hi ${bookings.user.name}</h2>
      <p>Your booking for <strong style="color: #F84565;">"$
        {bookings.show.movie.title}"</strong> is confirmed.</p>
        <p>
          <strong>Date:</strong> ${new Date(bookings.show.showDateTime).toLocaleDateString('en-US', {timeZone: 'Asia/Kathmandu'})} <br />
          <strong>Time:</strong> ${new Date(bookings.show.showDateTime).toLocaleTimeString('en-US', {timeZone: 'Asia/Kathmandu'})}
        </p>
        <p>Enjoy the show! </p>
        <p>Thanks for booking with us! <br />- movieBooking Team</p>
    </div>`
    })
  }

)


export const functions = [syncUserCreaton, 
                          syncUserDeletion,
                          syncUserUpdation,
                          releaseSeatAndDeleteBooking,
                          sendBookingConfirmationEmail
                        ];