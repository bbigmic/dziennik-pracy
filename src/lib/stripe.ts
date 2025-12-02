import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

export const PRICE_ID = process.env.STRIPE_PRICE_ID!;
export const MONTHLY_PRICE = 7; // $7/miesiąc

