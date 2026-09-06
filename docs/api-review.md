# Open Food Facts review, 6 September 2026

Official references checked before modifying the integration:

- https://openfoodfacts.github.io/openfoodfacts-server/api/
- https://openfoodfacts.github.io/openfoodfacts-server/api/ref-cheatsheet/

The existing read endpoint is `/api/v2/product/{barcode}` with an encoded `fields`
query. The cheatsheet also documents a `.json` suffix. Version 2 remains supported
for compatibility, although the introduction now recommends version 3 for new
integrations. This review preserves the existing endpoint and response contract.

Read requests need no API key. The documentation asks for application identification
via User-Agent. Browsers cannot supply that header. An OPTIONS request against the
existing endpoint returned 204, `Access-Control-Allow-Origin: *`, and an allowed
header list containing `X-User-Agent` on the review date. The app retains that
browser-safe header and its existing public repository identifier. It sends no
cookies, credentials, user identifier or personal log data.

The documented product-read limit is 15 requests per minute per IP. Search is
limited to 10 per minute; this app does not use network search. A 4.1-second
minimum between request starts keeps a single tab within the product-read limit.
Other tabs and devices sharing an IP can still cause rate limiting. Reloading
resets the local throttle. HTTP 429 remains a handled error, not an automatic retry.

Regression checks run with mocked responses and no external requests:

- `npm run check:http`: timeout through the response body, byte limit, status
  handling, content type, JSON parsing, destination and credential restrictions.
- `npm run check:barcode`: barcode formats and checksums, local pacing, product
  identity, response status, malformed numeric values and incomplete nutrition.

The lookup returns editable form values only. Saving still requires user review.
