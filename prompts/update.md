<!-- otp verify -->
<!-- /api/auth/otp/verify -->

```json
{
  "access_token": "string",
  "accessToken": "string", -> remove this
  "user": {
    "email": "string",
    "hasSelectedSections": true,
    "current_streak": 4,
    "longest_streak": 9,
    "country": "CD" || null,
    "region": string | null,
    "section": string | null,
    "section_id": string | null,
  }
}
```

this is the response and give me a file documentation for using this api note that give the requirement necessary to make in order to use this route

<!-- /api/users/me/profile -->

```json
{
  "email": "string",
  "hasSelectedSections": true,
  "current_streak": 4,
  "longest_streak": 9,
  "country": "CD" || null,
  "region": string | null,
  "section": string | null,
  "section_id": string | null,
}
```
-> only this how the response should be

<!-- /api/users/me/profile -->
```json
{
  "country": "CD", -> format for the country constant
  "region": "GOMA",
  "section_id": "01" -> only the send the update for section id
}
```
-> response should ony send the updated field and update them inside the native storage 