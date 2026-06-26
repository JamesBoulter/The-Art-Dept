const Stripe = require('stripe');

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body)
  };
}

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('YOUR_SECRET_KEY_HERE')) {
    const error = new Error('Stripe is not connected yet. Add STRIPE_SECRET_KEY in Netlify environment variables.');
    error.statusCode = 500;
    throw error;
  }

  return new Stripe(key);
}

function parseJsonBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch (error) {
    const badJson = new Error('The request body was not valid JSON.');
    badJson.statusCode = 400;
    throw badJson;
  }
}

function getSiteUrl(event) {
  const configured = process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (configured) return configured.replace(/\/$/, '');

  const headers = event.headers || {};
  const host = headers.host || headers.Host;
  const proto = headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'] || 'https';
  return host ? proto + '://' + host : 'http://localhost:8888';
}

function requireText(value, label) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    const error = new Error(label + ' is required.');
    error.statusCode = 400;
    throw error;
  }

  return value.trim();
}

function amountToCents(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0.5) {
    const error = new Error('Amount must be at least $0.50.');
    error.statusCode = 400;
    throw error;
  }

  return Math.round(amount * 100);
}

function stripeMessage(error) {
  if (!error || !error.message) return 'Something went wrong.';

  if (error.message.includes('Accounts v2 is not enabled')) {
    return 'Stripe Accounts v2 is not enabled for this sandbox yet. Finish Stripe Connect platform setup, then try again.';
  }

  if (error.message.includes('malformed API Key')) {
    return 'Stripe rejected the secret key. In Netlify, paste the full sk_test key into STRIPE_SECRET_KEY.';
  }

  return error.message;
}

async function getRecipientStatus(stripe, accountId) {
  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: ['configuration.recipient', 'requirements']
  });

  const transferStatus =
    account &&
    account.configuration &&
    account.configuration.recipient &&
    account.configuration.recipient.capabilities &&
    account.configuration.recipient.capabilities.stripe_balance &&
    account.configuration.recipient.capabilities.stripe_balance.stripe_transfers &&
    account.configuration.recipient.capabilities.stripe_balance.stripe_transfers.status;

  return {
    id: account.id,
    displayName: account.display_name || '',
    contactEmail: account.contact_email || '',
    transferStatus: transferStatus || 'unknown',
    readyToReceivePayments: transferStatus === 'active',
    requirements: account.requirements || null
  };
}

function handleError(error) {
  return json(error.statusCode || error.status || 500, {
    error: stripeMessage(error)
  });
}

module.exports = {
  amountToCents,
  getRecipientStatus,
  getSiteUrl,
  getStripeClient,
  handleError,
  json,
  jsonHeaders,
  parseJsonBody,
  requireText
};
