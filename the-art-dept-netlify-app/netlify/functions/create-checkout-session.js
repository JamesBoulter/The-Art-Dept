const {
  amountToCents,
  getRecipientStatus,
  getSiteUrl,
  getStripeClient,
  handleError,
  json,
  parseJsonBody,
  requireText
} = require('./_shared');

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST.' });

  try {
    const stripe = getStripeClient();
    const body = parseJsonBody(event);
    const connectedAccountId = requireText(body.connectedAccountId, 'Connected artist account ID');
    const name = requireText(body.name || 'The Art Dept commission', 'Checkout title');
    const description = body.description || 'Commission payment through The Art Dept';
    const amountInCents = amountToCents(body.amount);
    const currency = String(body.currency || 'usd').toLowerCase();
    const status = await getRecipientStatus(stripe, connectedAccountId);

    if (!status.readyToReceivePayments) {
      return json(400, {
        error: 'That artist still needs to finish Stripe onboarding before payments can be sent to them.',
        accountStatus: status
      });
    }

    const siteUrl = getSiteUrl(event);
    const platformFee = Math.round(amountInCents * 0.05);
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amountInCents,
            product_data: {
              name,
              description
            }
          },
          quantity: 1
        }
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: connectedAccountId
        }
      },
      mode: 'payment',
      success_url: siteUrl + '/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: siteUrl + '/#request'
    });

    return json(200, {
      url: session.url,
      platformFee,
      connectedAccountId
    });
  } catch (error) {
    return handleError(error);
  }
};
