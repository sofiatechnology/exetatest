# Frontend API Reference (minimal)

This document describes the API endpoints and response shapes frontend should expect.

## POST /api/auth/otp/verify
Verify OTP and sign in. Request body:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Success response (200):

```json
{
  "access_token": "string",
  "user": {
    "email": "string",
    "hasSelectedSections": true,
    "current_streak": 4,
    "longest_streak": 9,
    "country": "CD" | null,
    "region": "GOMA" | null,
    "section": "LATIN-PHILO" | null,
    "section_id": "01" | null
  }
}
```

Notes:
- The response contains `access_token` (JWT) and a `user` object.
- Do NOT expect an `accessToken` camel-cased field — it has been removed.

---

## GET /api/users/me/profile
Get the current authenticated user's profile.

Success response (200):

```json
{
  "email": "string",
  "hasSelectedSections": true,
  "current_streak": 4,
  "longest_streak": 9,
  "country": "CD" | null,
  "region": "GOMA" | null,
  "section": "LATIN-PHILO" | null,
  "section_id": "01" | null
}
```

Notes:
- This is the canonical profile object used by the app for deciding onboarding flows and UI.

---

## PATCH /api/users/me/profile
Partial update of profile. Send only fields you want to change. Examples:

Request to update country/region:

```json
{
  "country": "CD",
  "region": "GOMA"
}
```

Request to set section by id (use `section_id` from GET /sections):

```json
{
  "section_id": "01"
}
```

Response: only the updated fields will be returned. Examples:

- When updating `section_id`:

```json
{ "section_id": "01" }
```

- When updating `country` and `region`:

```json
{ "country": "CD", "region": "GOMA" }
```

Notes:
- To clear `section_id`, send `"section_id": null` and the response will be `{ "section_id": null }`.
- `section` (human label) is derived from `section_id` when provided; prefer updating `section_id` instead of free-text `section`.
- `country` must be a valid ISO Alpha-2 country code (e.g. `CD`). The server validates the code against an internal country list and will return `400 Invalid country code` for unknown values.

---

## Errors
Standard error shape follows NestJS `HttpException` format:

```json
{
  "statusCode": 400,
  "message": "Validation failed or error message",
  "error": "Bad Request"
}
```

---

