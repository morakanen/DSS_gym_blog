import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const generate2FACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const send2FACode = async (email, code) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your 2FA Code',
    text: `Your 2FA code is: ${code}`,
    html: `<p>Your 2FA code is: <strong>${code}</strong></p>`
  });
};