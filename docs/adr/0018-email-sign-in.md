# 18. Email sign-in

## Status

Accepted. Extends [ADR 0004](0004-authentication-and-per-user-isolation.md).

## Context

A learner can own Tracks without a GitHub account. The same User needs to keep their Profile, learning history and MCP Tokens when they change how they sign in.

## Decision

A User has an internal UUID and at least one Sign-in Method. The database enforces uniqueness of the GitHub numeric ID and the normalized email address (trimmed and lowercased), and requires one of them on each User. A Session still carries the UUID and display fields. Private data access and MCP Token ownership continue to use that UUID.

An email sign-in request reserves an Email Challenge and sends one message with a six-digit code and a link containing 32 random bytes. Both expire after 15 minutes. Store a separate HMAC-SHA256 digest for each proof, using an email-specific key derived from the private app secret. Bind each digest to its proof type and challenge ID. Compare fixed-length digests in constant time. The link carries the proof in a URL fragment. Its localized page removes the fragment and submits the proof by POST. HTTP access logs therefore only see the page path. The first successful verification consumes the challenge under a database row lock in the account transaction.

Requesting a sign-in email always returns the same response shape for a valid address. Successful verification creates a missing User and Profile. The handle comes from the sanitized local part, with random digits on collision and a fallback for an empty or reserved name. The handle and display name initially match. The Public Profile starts enabled. The existing initials avatar and Settings handle editor apply.

GitHub OAuth requests `user:email`. Each callback reads the primary address from GitHub’s authenticated email list and accepts it only when GitHub marks it verified. An unbound GitHub identity can attach to the User with that address. An existing GitHub ID continues to identify its original User. An address explicitly chosen in Settings survives later callbacks. Conflicting identities on different Users cannot transfer ownership. Existing installations learn each User’s verified address on their next GitHub sign-in. [GitHub email API](https://docs.github.com/en/rest/users/emails#list-email-addresses-for-the-authenticated-user)

A signed-in User can also link GitHub explicitly. A same-origin POST starts OAuth and binds the provider state to the sealed Session. The callback checks that state before attaching to its Owner. Unlinking requires a verified sign-in email and available email delivery. Changing an email sends a code to the new address. This Email Challenge belongs to the requesting User, accepts a code only and requires the same Owner’s Session. The transaction checks address ownership again at verification.

An address can receive at most three messages in a rolling 15 minutes and ten in 24 hours, across both purposes. Five incorrect code attempts disable both proofs. Each IP can make 20 requests and 60 verification attempts per rolling 15 minutes, including invalid submissions. Database locks serialize quota reservations across app instances. Rate records store a keyed digest of the IP and endpoint group. Requests prune expired rate events and challenge history older than 24 hours. The client offers resend after 60 seconds.

Nodemailer sends multipart text and HTML over SMTP with ten-second connection, greeting and socket timeouts. Development and test processes use the capturing transport. A production fixture can opt in with `MAIL_TRANSPORT=capture`. Otherwise, an unset `SMTP_HOST` disables email sign-in. A public status endpoint exposes availability to the sign-in page and Settings. Disabled email endpoints return HTTP 503 before reserving quotas or accessing challenges. The test fixture can observe captured messages within the server process. Delivery failures generate a generic server log entry and a localized retry message. The email SFC is compiled into Nitro at build time, with light-theme colours and font stacks from the Signal tokens inlined for mail clients. The request carries the active UI locale. Deliverable links use the configured public origin.

## Consequences

Email and GitHub Users enter the same Onboarding and authorization paths. A User with a GitHub-only legacy row can keep signing in while their verified address is learned. Changing the private app secret invalidates outstanding Email Challenges as well as Sessions. Dokploy’s Traefik overwrites `X-Forwarded-For` with the real client IP. Rate limits therefore use its first address by default, falling back to the socket peer if the header is absent. Self-hosters exposing the app directly without a proxy must set `TRUST_PROXY_IP=false` to ignore forwarded addresses.
