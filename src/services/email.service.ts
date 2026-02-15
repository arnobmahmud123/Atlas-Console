import nodemailer from 'nodemailer';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT ?? 587);

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass }
  });
}

const FROM = process.env.EMAIL_FROM ?? 'no-reply@example.com';

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
}) {
  const transporter = getTransporter();
  if (!transporter) {
    // Dev-safe: don't fail application flows when SMTP isn't configured locally.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[email] SMTP not configured; skipping send', { to: params.to, subject: params.subject });
      return { skipped: true };
    }
    throw new Error('SMTP not configured');
  }

  return transporter.sendMail({ from: FROM, to: params.to, subject: params.subject, text: params.text });
}

export function emailDepositSuccess(amount: string) {
  return {
    subject: 'Deposit successful',
    text: `Your deposit of ${amount} was successful.`
  };
}

export function emailWithdrawalApproved(amount: string) {
  return {
    subject: 'Withdrawal approved',
    text: `Your withdrawal of ${amount} was approved and paid.`
  };
}

export function emailInvestmentReward(amount: string) {
  return {
    subject: 'Investment reward',
    text: `You received an investment reward of ${amount}.`
  };
}

export function emailKycStatus(status: 'APPROVED' | 'REJECTED') {
  return {
    subject: 'KYC status update',
    text: `Your KYC status is now ${status}.`
  };
}
