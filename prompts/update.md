Read and follow striclty @AGENTS.md file

these json are values which should be send to the client after these request

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
-> response should ony send the updated field


after that give me a file docs for the frontend to use this api