import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    // Using a recent stable API version
    stripeClient = new Stripe(key, { apiVersion: '2025-01-27.abc' as any });
  }
  return stripeClient;
}

/**
 * Initiates creation of a Stripe Express account for a merchant.
 */
export async function createMerchantAccount(email: string) {
  const stripe = getStripe();
  return await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

/**
 * Initiates an instant payout to the connected account.
 */
export async function initiateInstantPayout(accountId: string, amount: number) {
  const stripe = getStripe();
  // Ensure the amount is in the smallest currency unit (e.g., cents for USD)
  return await stripe.payouts.create({
    amount,
    currency: 'usd',
    method: 'instant',
  }, {
    stripeAccount: accountId,
  });
}

/**
 * Returns the URL to initiate the OAuth handshake with Stripe.
 */
export function getOAuthLink(clientId: string, redirectUri: string) {
    return `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}`;
}
