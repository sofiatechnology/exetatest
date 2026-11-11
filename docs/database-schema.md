# Database schema

The schema is defined by the Sequelize models in `src/models/`. Apply
`scripts/migrations/011-add-exam-and-game-schema.sql` to an existing PostgreSQL
database before deploying the updated API. It adds the exam and multiplayer
game properties/tables without copying or deleting existing records.

## Tables

| Table                | Properties                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`              | `id` (UUID), `email`, `country`, `province`, `avatar`, `role` (`admin`/`user`), `section_id`, `current_streak` (0), `longest_streak` (0), `longitude`, `latitude`, `createdAt`, `updatedAt` |
| `otps`               | `id`, `userId`, `opt_number`, `is_used` (false), `createdAt`, `expiresAt`                                                                                                                   |
| `sections`           | `id` (string section code), `name`, `createdAt`, `updatedAt`                                                                                                                                |
| `items`              | `id`, `year`, `category` (`cg`/`sc`/`co`/`la`), `section_id`, `is_all_sections` (false), timestamps                                                                                         |
| `courses`            | `id`, `item_id`, `name`, `title`, `passage`, timestamps                                                                                                                                     |
| `question`           | `id`, `course_id`, `question`, `time_limit`, `createdAt`                                                                                                                                    |
| `responses`          | `id`, `question_id`, `question`, `option_text` (required), `is_correct` (false), timestamps                                                                                                 |
| `revisions`          | `id`, `user_id`, `title`, `auto_scroll` (false), `public` (false), timestamps                                                                                                               |
| `revision_questions` | `id`, `revision_id`, `question_id`, `question_order`, `time_limit`, timestamps                                                                                                              |
| `game_sessions`      | `id`, `revision_id`, `host_id`, unique `pin_code`, `status` (`waiting`/`active`/`ended`), `current_question_index` (0), `started_at`, `ended_at`, timestamps                                |
| `game_players`       | `id`, `game_session_id`, nullable `user_id`, `nickname`, `score` (0), `joined_at`, timestamps                                                                                               |
| `player_answers`     | `id`, `game_player_id`, `question_id`, `response_id`, `is_correct`, `time_taken_ms`, `answered_at`, timestamps                                                                              |

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
