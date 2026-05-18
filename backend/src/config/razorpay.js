import Razorpay from "razorpay";
import envConfig from "./env.config.js";

if (!envConfig.razorpayKeyId || !envConfig.razorpayKeySecret) {
  throw new Error(
    "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables",
  );
}

const razorpay = new Razorpay({
  key_id: envConfig.razorpayKeyId,
  key_secret: envConfig.razorpayKeySecret,
});

export default razorpay;
