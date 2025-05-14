// utils/sendSMS.js
import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendOTP(phone, otp) {
  try {
    const message = await client.messages.create({
      body: `Your FitLife verification code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log(`✅ OTP sent to ${phone}: SID ${message.sid}`);
  } catch (error) {
    console.error('❌ Failed to send SMS:', error.message);
    throw error;
  }
}