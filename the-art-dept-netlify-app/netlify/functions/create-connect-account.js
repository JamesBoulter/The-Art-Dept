const {
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
    const displayName = requireText(body.displayName, 'Artist display name');
    const contactEmail = requireText(body.contactEmail, 'Artist email');
    const siteUrl = getSiteUrl(event);

    const account = await stripe.v2.core.accounts.create({
      display_name: displayName,
      contact_email: contactEmail,
      identity: {
        country: 'us'
      },
      dashboard: 'express',
      defaults: {
        responsibilities: {
          fees_collector: 'application',
          losses_collector: 'application'
        }
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: {
                requested: true
              }
            }
          }
        }
      }
    });

    const refreshUrl =
      siteUrl + '/?stripe_account=' + encodeURIComponent(account.id) + '&stripe_refresh=1#artist-signup';
    const returnUrl =
      siteUrl + '/?stripe_account=' + encodeURIComponent(account.id) + '&stripe_returned=1#artist-signup';

    const accountLink = await stripe.v2.core.accountLinks.create({
      account: account.id,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['recipient'],
          refresh_url: refreshUrl,
          return_url: returnUrl
        }
      }
    });

    return json(200, {
      accountId: account.id,
      onboardingUrl: accountLink.url,
      displayName,
      contactEmail
    });
  } catch (error) {
    return handleError(error);
  }
};
