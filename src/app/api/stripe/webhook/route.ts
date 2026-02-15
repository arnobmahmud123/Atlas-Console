import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handlePaymentWebhook } from '@/services/payment-webhook.service';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-06-20'
});

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    await handlePaymentWebhook({
      provider: 'STRIPE',
      signature: sig,
      payload: paymentIntent,
      externalReference: paymentIntent.id,
      amount: String(paymentIntent.amount_received / 100),
      userId: String(paymentIntent.metadata.userId || ''),
      debitAccountId: String(paymentIntent.metadata.debitAccountId || ''),
      creditAccountId: String(paymentIntent.metadata.creditAccountId || '')
    });
  }

  return NextResponse.json({ ok: true });
}
