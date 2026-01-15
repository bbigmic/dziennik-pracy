import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY nie jest ustawiony w zmiennych środowiskowych');
}

if (!process.env.STRIPE_PRICE_ID) {
  throw new Error('STRIPE_PRICE_ID nie jest ustawiony w zmiennych środowiskowych');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

export const PRICE_ID = process.env.STRIPE_PRICE_ID;
export const WEEKLY_PRICE = 8; // 8 zł/tydzień

