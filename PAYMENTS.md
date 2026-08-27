# NAV payment collection — dormant by default

This branch adds a Stripe-hosted Checkout session for the NAV Strength & Movement Assessment without enabling live collection.

## Safety behavior

- PAYMENTS_ENABLED must equal true before the function will contact Stripe.
- The function fails closed when the secret key or assessment Price ID is missing.
- The browser can select only the known assessment offer; it cannot choose an amount.
- The amount comes from the Stripe Price ID configured in Netlify.
- Stripe receives payment details directly; NAV does not store raw card data.
- The return page never claims that payment succeeded; payment status remains a Stripe-side confirmation.
- No secret is committed to GitHub or exposed to the browser.

## Netlify configuration

Keep these unset or disabled until the owner has completed the launch gates:

- PAYMENTS_ENABLED=false
- STRIPE_SECRET_KEY — add only as a Netlify environment variable, never in code
- STRIPE_PRICE_ASSESSMENT — the exact Stripe Price ID for the approved assessment amount
- PAYMENT_SITE_URL=https://coach-nate.netlify.app
- Optional: STRIPE_SUCCESS_URL and STRIPE_CANCEL_URL if the return paths are intentionally changed

## Activation checklist

Before setting PAYMENTS_ENABLED=true, confirm:

1. Business registration, operating name, and service area are resolved.
2. Appropriate professional/general liability coverage is active.
3. Scope, intake, informed consent, waiver, customer agreement, and safety/referral language are ready.
4. Privacy, Terms, cancellation, and refund language are reviewed and published.
5. Stripe live account activation is complete and the Price ID matches the approved offer.
6. Test-mode checkout, receipt/confirmation, cancellation, and duplicate-click behavior are verified.
7. The live collection method is explicitly authorized by the owner.
8. Link payments.html from the public coaching page, then set PAYMENTS_ENABLED=true.

Do not enable live collection merely because the code or preview exists.
