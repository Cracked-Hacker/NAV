const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "referrer-policy": "no-referrer"
};

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS
  });
}

function isEnabled(value) {
  return String(value || "").toLowerCase() === "true";
}

function safeReturnUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return url.toString();
    if (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) {
      return url.toString();
    }
  } catch {
    // Treat malformed or non-HTTPS return URLs as configuration errors.
  }
  return null;
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...JSON_HEADERS,
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type"
      }
    });
  }

  if (request.method !== "POST") {
    return json(405, { code: "method_not_allowed", message: "Use POST." });
  }

  // Fail closed by default. No Stripe request is made until the owner enables payments.
  if (!isEnabled(process.env.PAYMENTS_ENABLED)) {
    return json(503, {
      code: "payments_disabled",
      message: "Secure payment is not enabled yet."
    });
  }

  const secretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
  const assessmentPrice = String(process.env.STRIPE_PRICE_ASSESSMENT || "").trim();

  if (!secretKey || !assessmentPrice) {
    return json(503, {
      code: "payments_unconfigured",
      message: "Secure payment is not configured yet."
    });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json(400, { code: "invalid_json", message: "Request body must be JSON." });
  }

  // The browser can select only a known offer. The amount is always controlled by
  // the Stripe Price ID in Netlify environment variables, never by the browser.
  if (body?.offer !== "assessment") {
    return json(400, { code: "unknown_offer", message: "That offer is not available." });
  }

  const siteUrl = String(process.env.PAYMENT_SITE_URL || "https://coach-nate.netlify.app")
    .trim()
    .replace(/\/+$/, "");
  const defaultSuccessUrl = siteUrl + "/payments.html?status=returned&session_id={CHECKOUT_SESSION_ID}";
  const defaultCancelUrl = siteUrl + "/payments.html?status=canceled";
  const successUrl = safeReturnUrl(process.env.STRIPE_SUCCESS_URL || defaultSuccessUrl);
  const cancelUrl = safeReturnUrl(process.env.STRIPE_CANCEL_URL || defaultCancelUrl);

  if (!successUrl || !cancelUrl) {
    return json(500, {
      code: "invalid_return_urls",
      message: "Secure payment return URLs are not configured safely."
    });
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("line_items[0][price]", assessmentPrice);
  params.set("line_items[0][quantity]", "1");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("customer_creation", "always");
  params.set("billing_address_collection", "auto");
  params.set("metadata[offer]", "nav_strength_movement_assessment");
  params.set("metadata[source]", "nav_public_website");

  let stripeResponse;
  try {
    stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + secretKey,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: params
    });
  } catch {
    return json(502, {
      code: "stripe_unreachable",
      message: "Secure checkout is temporarily unavailable."
    });
  }

  const stripeData = await stripeResponse.json().catch(() => ({}));
  if (!stripeResponse.ok || !stripeData.url) {
    return json(502, {
      code: "stripe_checkout_failed",
      message: "Secure checkout could not be started."
    });
  }

  return json(200, { url: stripeData.url });
}
