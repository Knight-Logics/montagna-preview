# Visibility audit — Stephen Francis Montagna — official author website

- **Domain:** stephenfmontagnabooks.com
- **Pack:** full-api (Full Website Audit via API)
- **Date:** 2026-11-22
- **Generated:** 2026-11-22T15:30:53.299Z

## Module results

| Module | Status | Notes |
| --- | --- | --- |
| gbp | skipped | No gbpLocationEnv for this domain (no GBP listing in accounts.env map) |
| gsc-api | ok | GSC API audit completed (no UI export) |
| schema | failed | schema-audit.mjs exited 1; Expected evidence artifact was not written |
| security-headers | ok |  |
| psi | ok |  |
| crux | ok | CrUX API connected — no field data for this origin yet (normal for smaller/low-traffic sites) |
| bing | ok |  |
| seo-engine | ok | Completed with 1 warning(s) |
| clarity | skipped | Clarity skipped — missing CLARITY_API_TOKEN (project za6mj6fqaz detected). Generate token in Clarity → Settings → Data Export. |
| indexnow | ok | IndexNow HTTP 202 |
| geo | ok |  |
| analytics | ok |  |
| semrush | ok | Semrush Playwright scrape complete |
| semrush-import | skipped | E:\Website Audit\imports\stephenfmontagnabooks.com\semrush is empty — run tools/semrush-site-audit.mjs or export CSV from Semrush Site Audit |
| screamingfrog-import | skipped | No Screaming Frog exports at E:\Website Audit\imports\stephenfmontagnabooks.com\screamingfrog. Export CSV from SF into that folder. |
| log-import | skipped | No log exports at E:\Website Audit\imports\stephenfmontagnabooks.com\logs. Drop .log/.txt samples there or set LOG_EXPORT_DIR. |

## Credentials present (names only)

Present: GOOGLE_API_KEY, GSC_OAUTH_CLIENT_ID, BING_WEBMASTER_API_KEY, BING_WEBMASTER_OAUTH_CLIENT_ID, SERPER_API_KEY, DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD, CLARITY_PROJECT_ID, CLARITY_TOKENS_LOADED, INDEXNOW_KEY, GBP_OAUTH_CLIENT_ID, GBP_REFRESH_TOKEN, SALS_GBP_LOCATION_ID
Missing: CLARITY_API_TOKEN

