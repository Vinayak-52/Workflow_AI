---
tags:
- security
- privacy
- oauth
title: Security and Privacy
---

# 1. Security baseline

-   HTTPS in deployed environments.
-   OAuth authorization-code flow on the backend.
-   Validate OAuth `state`; use PKCE where appropriate for the selected
    flow.
-   Keep client secrets, LLM keys and token-encryption keys in server
    environment/secret manager.
-   Encrypt Google refresh tokens at application level.
-   Restrict token-store access to trusted backend code.
-   Never log access tokens, refresh tokens, full email bodies or
    sensitive note content.
-   Apply per-user authorization to every data endpoint.
-   Validate inputs and limit request sizes.
-   Add rate limits to AI and integration endpoints.
-   Use secure cookies/session configuration.
-   Configure CORS narrowly.
-   Keep dependencies updated.

# 2. Read-only Google permission boundary

MVP scopes: - `https://www.googleapis.com/auth/gmail.readonly` -
`https://www.googleapis.com/auth/calendar.readonly`

Do not request Gmail send/modify scopes or Calendar write scopes in the
MVP.

The user's separate product policy says they want confirmation before
sending email or changing Calendar. The current MVP does not implement
those actions at all because the integration grant is read-only. A
future version could add opt-in write scopes and explicit per-action
confirmation, but that is a separate scope change and must be reviewed.

# 3. OAuth setup checklist

1.  Create a Google Cloud project.
2.  Enable Gmail API and Google Calendar API.
3.  Configure OAuth consent screen and audience.
4.  Add development test users where applicable.
5.  Create OAuth Web application credentials.
6.  Register local and production redirect URIs.
7.  Request only the required read-only scopes.
8.  Validate `state` on callback.
9.  Exchange authorization code on backend.
10. Store refresh token encrypted.
11. Refresh access tokens server-side.
12. Handle revoked/expired access.
13. Provide disconnect and credential deletion.
14. Review Google's current OAuth verification requirements before
    public release.

Official references: - Google OAuth web-server flow:
https://developers.google.com/identity/protocols/oauth2/web-server -
Gmail API scopes:
https://developers.google.com/workspace/gmail/api/auth/scopes - Calendar
API authorization:
https://developers.google.com/workspace/calendar/api/auth

# 4. Privacy UX

Before connection, explain: - What Gmail information is read. - What
Calendar information is read. - Why each permission is needed. - What is
stored and what is not. - How to disconnect and delete credentials.

Show connection status and granted scopes in Settings. Do not use vague
labels such as "full Google access."

# 5. Threats to test

-   OAuth state mismatch/CSRF.
-   Cross-user IDOR.
-   Token leakage in logs or frontend bundles.
-   Prompt injection in email/document content.
-   Malicious or oversized file uploads.
-   XSS from rendered Markdown/email HTML.
-   Untrusted links and remote images in email content.
-   AI tool-call authorization bypass.
-   Accidental external write operation.
-   Insecure Firestore rules.
