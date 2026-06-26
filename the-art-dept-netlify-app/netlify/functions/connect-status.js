const {
  getRecipientStatus,
  getStripeClient,
  handleError,
  json,
  parseJsonBody,
  requireText
} = require('./_shared');

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return json(405, { error: 'Use GET or POST.' });

  try {
    const stripe = getStripeClient();
    const body = event.httpMethod === 'POST' ? parseJsonBody(event) : {};
    const accountId = requireText(
      body.accountId || (event.queryStringParameters && event.queryStringParameters.accountId),
      'Stripe account ID'
    );

    return json(200, await getRecipientStatus(stripe, accountId));
  } catch (error) {
    return handleError(error);
  }
};
