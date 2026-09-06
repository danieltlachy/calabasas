const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationCode(email, code) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return;
  }

  try {
    await resend.emails.send({
      from: "FAYUCA <onboarding@resend.dev>",
      to: [email],
      subject: "Your FAYUCA verification code",
      html: `<p>Your verification code is: <strong>${code}</strong></p>
             <p>It expires in 10 minutes.</p>`,
    });
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.warn("Resend rejected the email; printing the code instead:");
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    console.warn(error.message || error);
  }
}

async function sendPasswordResetLink(email, resetUrl) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    return;
  }

  try {
    await resend.emails.send({
      from: "FAYUCA <onboarding@resend.dev>",
      to: [email],
      subject: "Reset your FAYUCA password",
      html: `<p>Click the link below to reset your password:</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>This link expires in 30 minutes.</p>`,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.warn("Resend rejected the reset email; printing the link instead:");
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    console.warn(error.message || error);
  }
}

module.exports = { sendVerificationCode, sendPasswordResetLink };