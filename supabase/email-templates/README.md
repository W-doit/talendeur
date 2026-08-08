# Talendeur Auth email templates

Branded HTML for Supabase Auth emails. Hosted projects apply these in the **Dashboard** (not via git push).

## Where to paste

Open: [Authentication → Email Templates](https://supabase.com/dashboard/project/clmnzuqgybreszqphvgt/auth/templates)

For each template below:

1. Set the **Subject**
2. Replace the body with the matching HTML file (copy everything inside the file, including `<!DOCTYPE html>...`)
3. Save

| Dashboard template | Subject | File |
| --- | --- | --- |
| Confirm sign up | `Welcome to Talendeur — confirm your email` | [confirm-signup.html](./confirm-signup.html) |
| Reset password | `Reset your Talendeur password` | [reset-password.html](./reset-password.html) |
| Magic Link | `Your Talendeur sign-in link` | [magic-link.html](./magic-link.html) |
| Change Email Address | `Confirm your new Talendeur email` | [change-email.html](./change-email.html) |
| Invite user | `You're invited to Talendeur` | [invite.html](./invite.html) |
| Reauthentication | `Your Talendeur verification code` | [reauthentication.html](./reauthentication.html) |

## Design notes

- Brand colors: navy `#180D51`, burnt orange `#D1163E`, accent `#FF9F14`
- Header uses the same white → orange → primary feel as the site hero
- Every flow still uses `{{ .ConfirmationURL }}` and/or `{{ .Token }}` so confirm / reset / OTP keep working
- Keep **Site URL** and redirect allow-list correct under Authentication → URL Configuration

## Optional: Management API

If you prefer API updates instead of pasting, see [Supabase email templates docs](https://supabase.com/docs/guides/auth/auth-email-templates) (`mailer_subjects_*` / `mailer_templates_*_content`).
