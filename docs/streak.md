# Streak Tracking

The API updates streaks from authenticated user activity. Any request with a valid JWT can count as activity for the user's local calendar day.

## Frontend header

Send the user's timezone offset on every authenticated request:

```http
X-Timezone-Offset-Minutes: -120
```

Use the browser or mobile runtime value that matches JavaScript `Date.getTimezoneOffset()`:

```ts
const timezoneOffsetMinutes = new Date().getTimezoneOffset();
```

Examples:

- UTC+2 sends `-120`
- UTC+1 sends `-60`
- UTC sends `0`
- UTC-5 sends `300`

If the header is missing or invalid, the API falls back to UTC.

## How the streak changes

- First activity creates a `current_streak` of `1`.
- More activity on the same local calendar day keeps the same streak.
- Activity on the next local calendar day increases `current_streak` by `1`.
- Activity after missing one or more full local calendar days resets `current_streak` to `1`.
- `longest_streak` updates whenever `current_streak` becomes higher than the previous longest streak.

## Recommended frontend flow

Include the timezone header in the shared authenticated API client/interceptor so every protected request sends it:

```ts
api.interceptors.request.use((config) => {
  const token = authStore.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Timezone-Offset-Minutes'] =
      String(new Date().getTimezoneOffset());
  }

  return config;
});
```

Use these fields from the profile or login response to render the UI:

```json
{
  "current_streak": 4,
  "longest_streak": 9
}
```

The frontend does not need to calculate streaks. It only sends the timezone offset and displays the latest values returned by the API.
