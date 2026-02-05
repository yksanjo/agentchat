import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2026-01-28.clover',
    });
    
    const body = await request.json();
    const { channelId, amount = 500 } = body; // amount in cents ($5.00)

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        channelId,
        type: 'peek_access',
        duration: '30_minutes'
      }
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return Response.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
