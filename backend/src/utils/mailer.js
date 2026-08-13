const nodemailer = require('nodemailer');

// Lazily built so a missing EMAIL_USER/EMAIL_PASS doesn't crash the app at
// startup — it only matters once an email actually needs to go out.
function buildTransport() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

// Shared by every email below. The interesting content (subject/html) is
// always logged to the console first — that's what makes every email flow
// in this app testable before EMAIL_USER/EMAIL_PASS are ever set, and a
// harmless fallback afterwards (server logs aren't shown to the user). A
// broken mail server is caught here too, so a flaky SMTP connection can
// never turn into a failed API response for the action that triggered it.
async function send({ to, subject, html, logLine }) {
  console.log(`[mailer] ${logLine}`);

  const transport = buildTransport();
  if (!transport) {
    console.log('[mailer] EMAIL_USER/EMAIL_PASS not set — skipping actual send.');
    return;
  }

  try {
    await transport.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
  } catch (err) {
    console.error('[mailer] Failed to send email:', err.message);
  }
}

function layout(heading, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #4338ca;">${heading}</h2>
      ${bodyHtml}
    </div>
  `;
}

function button(href, label) {
  return `<a href="${href}" style="background: #4338ca; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">${label}</a>`;
}

async function sendPasswordResetEmail(email, resetLink) {
  await send({
    to: email,
    subject: 'PitchPoint – Reset your password',
    logLine: `Password reset link for ${email}: ${resetLink}`,
    html: layout(
      'Reset your password',
      `
        <p>We received a request to reset your PitchPoint password. This link expires in 15 minutes.</p>
        <p>${button(resetLink, 'Reset password')}</p>
        <p style="color: #64748b; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      `
    ),
  });
}

async function sendVerificationEmail(email, verifyLink) {
  await send({
    to: email,
    subject: 'PitchPoint – Verify your email',
    logLine: `Verification link for ${email}: ${verifyLink}`,
    html: layout(
      'Verify your email',
      `
        <p>Thanks for signing up for PitchPoint! Confirm this is your email address to finish setting up your account.</p>
        <p>${button(verifyLink, 'Verify email')}</p>
        <p style="color: #64748b; font-size: 13px;">This link expires in 24 hours. You can still use PitchPoint before verifying — this just confirms we can reach you.</p>
      `
    ),
  });
}

async function sendBookingConfirmationEmail(
  email,
  { pitchName, pitchAddress, date, startTime, endTime }
) {
  await send({
    to: email,
    subject: `PitchPoint – Booking confirmed: ${pitchName}`,
    logLine: `Booking confirmation for ${email}: ${pitchName} on ${date} ${startTime}-${endTime}`,
    html: layout(
      'Booking confirmed!',
      `
        <p>Your slot is booked:</p>
        <ul style="color: #1e293b;">
          <li><strong>${pitchName}</strong></li>
          <li>${pitchAddress}</li>
          <li>${date}, ${startTime.slice(0, 5)}–${endTime.slice(0, 5)}</li>
        </ul>
        <p style="color: #64748b; font-size: 13px;">You can view or cancel this booking any time from "My bookings" in PitchPoint.</p>
      `
    ),
  });
}

async function sendWaitlistPromotedEmail(
  email,
  { pitchName, pitchAddress, date, startTime, endTime }
) {
  await send({
    to: email,
    subject: `PitchPoint – A slot opened up: ${pitchName}`,
    logLine: `Waitlist promotion for ${email}: ${pitchName} on ${date} ${startTime}-${endTime}`,
    html: layout(
      'Good news — you’re in!',
      `
        <p>A spot you were waiting for just opened up, and it's now booked under your name:</p>
        <ul style="color: #1e293b;">
          <li><strong>${pitchName}</strong></li>
          <li>${pitchAddress}</li>
          <li>${date}, ${startTime.slice(0, 5)}–${endTime.slice(0, 5)}</li>
        </ul>
        <p style="color: #64748b; font-size: 13px;">You can view or cancel this booking any time from "My bookings" in PitchPoint.</p>
      `
    ),
  });
}

async function sendBookingReminderEmail(
  email,
  { pitchName, pitchAddress, date, startTime, endTime }
) {
  await send({
    to: email,
    subject: `PitchPoint – Reminder: ${pitchName} tomorrow`,
    logLine: `Booking reminder for ${email}: ${pitchName} on ${date} ${startTime}-${endTime}`,
    html: layout(
      'See you tomorrow!',
      `
        <p>Just a reminder about your upcoming booking:</p>
        <ul style="color: #1e293b;">
          <li><strong>${pitchName}</strong></li>
          <li>${pitchAddress}</li>
          <li>${date}, ${startTime.slice(0, 5)}–${endTime.slice(0, 5)}</li>
        </ul>
      `
    ),
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendBookingConfirmationEmail,
  sendWaitlistPromotedEmail,
  sendBookingReminderEmail,
};
