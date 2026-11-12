# Database schema

The schema is defined by the Sequelize models in `src/models/` and the complete
baseline in `scripts/migrations/001-initial-schema.sql`. This is the single
initial migration for creating a fresh database. The reset script applies it
after dropping the existing public schema and all of its data. Do not run that
reset script against a database whose data must be retained.

## Tables

| Table                | Properties |
| -------------------- | ---------- |
| `users`              | `id` (UUID), `email`, `country`, `province`, `avatar`, `longitude`, `latitude`, `region`, section fields, role, streak fields, `last_activity_date`, timestamps |
| `otps`               | `id`, `userId`, `code`, `opt_number`, `is_used`, `expiresAt`, `isVerified`, `attemptCount`, `requestIp`, timestamps |
| `sections`           | `id` (string section code), `name`, timestamps |
| `items`              | `id`, legacy `type` and `universal`, `category`, `section_id`, `year`, `is_all_sections`, timestamps |
| `item_courses`       | `id`, `course`, `item_id`, `passage`, timestamps |
| `item_questions`     | `id`, `item_course_id`, `question`, `options`, `answer`, timestamps |
| `courses`            | `id`, `name`, nullable `section_id` and `item_id`, `title`, `passage`, timestamps |
| `levels`              | `id`, `course_id`, `title`, `passage`, timestamps |
| `modele`             | `id`, `title`, `pin`, `auto_scroll`, `public`, timestamps |
| `question`           | Legacy question fields plus `course_id`, `question`, `time_limit`, timestamps |
| `email_suppressions` | `id`, unique `email`, `reason`, `softBounceCount`, timestamps |
| `webhook_events`     | `id`, unique `eventId`, `eventType`, `createdAt` |
| `responses`          | `id`, `question_id`, `question`, `option_text`, `is_correct`, timestamps |
| `revisions`          | `id`, `user_id`, `title`, `auto_scroll`, `public`, timestamps |
| `revision_questions` | `id`, `revision_id`, `question_id`, `question_order`, `time_limit`, timestamps |
| `game_sessions`      | `id`, `revision_id`, `host_id`, unique `pin_code`, `status`, `current_question_index`, `started_at`, `question_started_at`, `ended_at`, timestamps |
| `game_players`       | `id`, `game_session_id`, nullable `user_id`, `nickname`, `score`, `joined_at`, timestamps |
| `player_answers`     | `id`, `game_player_id`, `question_id`, `response_id`, `is_correct`, `time_taken_ms`, `answered_at`, timestamps; unique per player and question |

`items.type`/`items.universal` and the requested
`items.category`/`items.is_all_sections` are kept synchronized when items are
created or updated through Sequelize. The legacy `type` column is nullable for
items created using `category`. `courses.section_id` and the former
`question` fields (`text`, `response`, `correct_answer`, `time`, `level_id`, and
`modele_id`) remain nullable for existing API compatibility.

Section IDs remain strings because existing users, items, and courses reference
the seeded section codes. Changing them to integers requires a separate data
migration and client/API update.

The game-session model generates a unique six-digit PIN when one is not supplied.
Live games use `question_started_at` to validate submitted answer times. Existing
databases should apply `scripts/migrations/002-live-games.sql`; it also adds the
unique answer index that prevents duplicate scoring.
