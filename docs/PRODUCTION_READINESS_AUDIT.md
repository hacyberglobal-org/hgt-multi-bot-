# HGT Multi-Bot Grabber — Production Readiness Audit

Date: 2026-10-14

## Current release decision

**NO-GO for production release.** The AppDeploy V8 deployment reports `ready` with an older QA snapshot showing no frontend/network errors, but that is not proof of authorized third-party API connectivity. The current Vercel status check for the security-hardening branch is failing. The AppDeploy V8 secret inventory returned no configured secrets.

Do not claim that gig-platform APIs are connected or production-ready until each integration passes a real authorized end-to-end test.

## Confirmed findings

- The dashboard UI exists in the repository and contains dashboard, offer, driver, alert, integration and reporting components.
- The Argyle service registry starts with platform coverage marked unconfirmed, which is the correct default. However, the service also contains an initialized demo verification record with fabricated-looking user, item, token, consent and data values. Remove this record from production paths and ensure demo fixtures are isolated from production builds.
- `RealDriverConnector.tsx` contains hardcoded sample driver profiles, personal details, platform status/earnings, secret-like tokens, and fake connection/latency/token-refresh flows. These are not evidence of real platform connectivity and must be removed or clearly isolated as non-production fixtures.
- The repository includes anti-detection / stealth / MFA-bypass-related fields and behavior. These must not be used to evade platform controls. Remove them and keep the product to authorized, user-consented data access, opportunity tracking, alerts and manual decisions.
- Some UI flows can fall back to local cached/example data when a live API call fails. Production must display **Unavailable / Not verified** instead of showing cached values as live verification.
- The V8 AppDeploy secret inventory is empty. The server needs separately configured, least-privilege secrets before server-side integrations can be tested.
- The security-hardening pull request is a draft and the Vercel status check is failing.

## Required provider verification

For every provider, record these separately: provider approval/access status; environment (sandbox vs production); secret configured (boolean only, never print the value); authenticated health check; permitted scopes/fields; webhook signature verification; persistence check; negative test (missing/invalid credential); timestamp and test environment.

Only mark an integration **Production verified** when all applicable checks pass against the provider's authorized production API. A checkbox or a local simulation is not sufficient.

### Provider guidance

- Uber Driver API access is limited and requires application/approval for access: https://developer.uber.com/docs/drivers/references/api
- DoorDash Drive production access is limited and requires a production-access review: https://developer.doordash.com/en-US/docs/drive/overview/integration_requirements/
- Instacart requires API access and production-key approval: https://docs.instacart.com/developer_platform_api/get_started/overview/
- Argyle should be used only with the worker's explicit consent and only for fields the provider authorizes.

Do not scrape private endpoints, collect passwords/OTPs/session cookies, or automate acceptance actions that evade the platform's controls.

## Release checklist

- [ ] Rotate any credentials previously exposed in source control or chat; remove them from code and history where appropriate.
- [ ] Remove fake driver records and all hardcoded personal data/token-like values from production paths.
- [ ] Remove fake ping, token refresh, and fabricated account-standing success paths.
- [ ] Remove anti-detection, stealth, MFA-bypass, and automatic platform-control evasion functionality.
- [ ] Ensure API failure produces an explicit unverified/unavailable state.
- [ ] Configure secrets in the production secret manager (names only may be logged; never values).
- [ ] Add automated tests for missing secrets, invalid credentials, webhook signatures, consent enforcement, data persistence, and honest status reporting.
- [ ] Run the real package install, security tests, type-check, production build and deployment smoke tests.
- [ ] Resolve the failing Vercel check.
- [ ] Obtain platform approvals and run authorized sandbox tests; then obtain production access and run provider-approved live tests.
- [ ] Review privacy notices, retention/deletion, consent revocation and access controls.
- [ ] Merge and deploy only after every required check passes and the owner reviews the release.

## Current known-good vs unknown

- AppDeploy V8 status: reported ready; prior QA snapshot had no frontend/network errors.
- Vercel status on the reviewed commit: failing.
- Production provider secrets in AppDeploy V8: none listed.
- Live Uber / DoorDash / Instacart / Walmart Spark / Amazon Flex / Lyft / Roadie / Veho API access: **not verified**.
- Argyle live coverage and production key: **not verified**.
- Payments/webhooks: **not verified**.
