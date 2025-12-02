import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

export const PRICE_ID = process.env.STRIPE_PRICE_ID!;
export const WEEKLY_PRICE = 7.99; // 7.99 zł/tydzień

