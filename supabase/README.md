# Michel's Life — Supabase backend

## Authentication UX contract

Michel's Life is **password-first** on Windows and Android.

- Default sign-in: email + password.
- Account creation: email + password.
- Optional fallback: email one-time code (OTP) for an existing account.
- OTP requests use `create_user:false`; requesting a code must never create an account.
- Code mode is not persisted. A fresh sign-in surface always returns to Password.

## Hosted Supabase email template required for OTP

The shared client already implements OTP request and verification. For the hosted project to send a visible six-digit code instead of only a magic link, configure the project's **Magic Link** email template in Supabase Auth to include the token variable:

```html
<h2>Your Michel's Life sign-in code</h2>
<p>Enter this code in Michel's Life:</p>
<p><strong>{{ .Token }}</strong></p>
```

Keep the normal Supabase confirmation/recovery templates available for account confirmation and password recovery.

This template is provider-side configuration and is intentionally not stored as a client secret or bundled into the application.

## Security

Desktop and Android embed only the Supabase **publishable** key. Never commit or bundle a secret key or `service_role` credential.

All Michel's Life data tables are protected by RLS and ownership checks using `auth.uid()`.
