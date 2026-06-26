# The Art Dept Version 2

This is the Netlify version with:

- the full public website
- artist signup with Netlify Forms
- Stripe Connect artist onboarding
- Stripe Checkout with a 5% marketplace fee

## What to upload

Use this folder:

`the-art-dept-netlify-app`

For Netlify, do not use only the `public` folder. The `netlify/functions` folder is what keeps your Stripe secret key private.

## Netlify setup

1. Put this folder in GitHub, then connect the GitHub repo to Netlify.
2. In Netlify, set the publish directory to `public`.
3. In Netlify, set the functions directory to `netlify/functions`.
4. In Netlify environment variables, add:

`STRIPE_SECRET_KEY`

Use your Stripe sandbox secret key that starts with `sk_test_`.

Optional:

`SITE_URL`

Set it to your real Netlify site URL, like `https://the-art-dept.netlify.app`.

## Stripe setup

In your Stripe dashboard:

1. Stay in sandbox/test mode while testing.
2. Finish Connect platform setup.
3. Make sure Accounts v2 is enabled for your sandbox.
4. Use the full sandbox secret key in Netlify, not the publishable key.

## How it works

When someone applies as an artist and checks the Stripe onboarding box:

1. The application is saved through Netlify Forms.
2. A Stripe connected account is created.
3. The artist is sent to Stripe onboarding.
4. When they come back, the site can check whether they are ready to receive payments.

Checkout only works after the connected artist finishes Stripe onboarding.

## Important

Never put your Stripe secret key in `public/index.html`, `public/app.js`, or any browser file. Only put it in Netlify environment variables.
