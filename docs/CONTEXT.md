# Domain glossary

| Term                     | Definition                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User                     | A learner identified by their GitHub account.                                                                                                                                                                                               |
| Session                  | A signed-in browser's association with one User.                                                                                                                                                                                            |
| Owner                    | The User to whom a learning record belongs.                                                                                                                                                                                                 |
| Profile                  | The Owner's learning goals, background and optional preferred UI language.                                                                                                                                                                  |
| Onboarding Questionnaire | The three required Profile answers are stack, goals and grade (junior, middle, senior or lead, stored as experience). Submission records the completion time.                                                                               |
| Topic                    | A concept or skill in one Owner's Topic Catalog.                                                                                                                                                                                            |
| Topic Catalog            | All of one Owner's Topics, shared across their Tracks.                                                                                                                                                                                      |
| Topic Slug               | A unique name within a Topic Catalog, such as `react/use-transition`. Each slash-separated segment contains lowercase letters and digits, optionally joined by hyphens. The whole name fits in 120 characters.                              |
| TopicEdge                | A directed prerequisite relationship between two distinct Topics in the same Topic Catalog. Learn the source Topic before the destination Topic.                                                                                            |
| Track                    | A selection of Topics assembled by the User's external agent around a learning goal. Each member has a position within the Track.                                                                                                           |
| Track Graph              | A Track's Topics and the TopicEdges whose two endpoints both belong to that Track.                                                                                                                                                          |
| Track Sources            | An optional GitHub repository and up to 20 documentation links that inform a Track.                                                                                                                                                         |
| Lesson                   | A unit of study belonging to one Topic. Lessons have a position within their Topic and are shared by every Track containing it.                                                                                                             |
| Block                    | One element of a Lesson's ordered content, identified by a stable ID unique within that Lesson.                                                                                                                                             |
| Theory Block             | Lesson text written in Markdown.                                                                                                                                                                                                            |
| Code Block               | Code in a named language with an optional explanation.                                                                                                                                                                                      |
| Callout Block            | Markdown highlighting a gotcha, production consideration or tip.                                                                                                                                                                            |
| Link Block               | A titled HTTP or HTTPS resource with an optional note.                                                                                                                                                                                      |
| Video Block              | A titled YouTube watch, short or shortened video link with an optional note.                                                                                                                                                                |
| Quiz                     | A Block with one to ten multiple-choice questions. Each has two to six options and one correct index.                                                                                                                                       |
| Quiz Attempt             | One submission of option indices for a Quiz, with its Answer Source and score.                                                                                                                                                              |
| Exercise                 | A Block with a Markdown prompt and solution, plus optional hints. The User's external agent assesses free-text work.                                                                                                                        |
| Lesson Progress          | The Owner's record of when they read a Lesson.                                                                                                                                                                                              |
| Mastery                  | The Owner's level for a Topic, with optional evidence. Levels are 0 (don't know), 1 (read), 2 (apply), 3 (explain) and 4 (internals).                                                                                                       |
| ReviewItem               | A Topic scheduled for the Owner to revisit, with its Review Box, due time and latest review result.                                                                                                                                         |
| Review Box               | A Leitner box numbered 0 through 4, determining the interval until the next review.                                                                                                                                                         |
| GrillSession             | A stored round of questions chosen by the external agent, optionally for one Track. It has a target size and can be open or finished.                                                                                                       |
| Grill Question           | An ordered prompt in a GrillSession, optionally associated with a Topic. It holds the submitted answer, Answer Source and the external agent's judgment.                                                                                    |
| Verdict                  | A strong, partial or weak assessment. The external agent judges free text. A Practice Quiz derives its Verdict from the score.                                                                                                              |
| Answer Source            | Where the learner submitted an answer, either the UI (`ui`) or an MCP client (`mcp`).                                                                                                                                                       |
| MCP Token                | A personal credential that lets an external agent act for one User until revoked.                                                                                                                                                           |
| Tool                     | A named operation an external agent can call with an MCP Token to work with the Owner's data.                                                                                                                                               |
| Practice Quiz            | A review using all Quiz questions from a Topic’s Lessons. All correct gives a strong Verdict, at least half gives partial, and fewer than half gives weak.                                                                                  |
| Next Step                | The current learning action shared by the dashboard and the external agent. In priority order, complete onboarding, build a first Track, continue a GrillSession, review due Topics, study an eligible Topic or plan when nothing is ready. |
| Activity                 | A dated observation of a Lesson read, Quiz Attempt, Grill answer or judgment, review result or Mastery assessment. Progress shows the latest 30 observations.                                                                               |
| Public Track             | A Track its Owner has published for anyone to read, including the Lessons of every member Topic.                                                                                                                                            |
| Track Slug               | A lowercase, hyphen-separated URL name unique among one Owner’s Tracks. Renaming the Track preserves it.                                                                                                                                    |
| Fork                     | A one-time copy of a Public Track into another Owner’s Topic Catalog, private on creation.                                                                                                                                                  |
| Forked From              | The source attribution captured when a Fork is created, linked while the source is public.                                                                                                                                                  |
| Public Profile           | A User’s public login, name, avatar and list of Public Tracks.                                                                                                                                                                              |
| Terms Acceptance         | The version of the Publishing rules and Terms of Use a User accepted and the time of acceptance.                                                                                                                                            |
| Public Fork              | A Fork its Owner has published. It appears in its source Track’s public list of Forks.                                                                                                                                                      |

On the dashboard, when a different Topic is ready to study alongside due Reviews, the Next Step names the study Topic and offers a secondary action to review the due Topics first.

## Mastery

Reading every Lesson in a Topic with at least one Lesson raises Mastery from 0 to 1. When every Quiz in the Topic has a fully correct latest Quiz Attempt, Mastery rises to 2. This requires at least one Quiz. Neither rule lowers Mastery. The external agent assesses levels 3 and 4 with evidence. [ADR 0013](adr/0013-mastery-auto-raise.md)

## Activity history

Each Quiz Attempt has its own row. A Grill Question retains its answer and judgment times. Lesson Progress, ReviewItems and Mastery retain their latest observation for each Lesson or Topic. Progress uses those timestamps, so a later update replaces the earlier observation from the same row.

## Russian UI terms

| Domain term              | Russian UI                                                                    |
| ------------------------ | ----------------------------------------------------------------------------- |
| Track                    | трек                                                                          |
| Public Track             | публичный трек                                                                |
| Topic                    | тема                                                                          |
| Lesson                   | урок                                                                          |
| Quiz / Practice Quiz     | тест / тренировочный тест                                                     |
| Grill / GrillSession     | опрос                                                                         |
| Review                   | повторение                                                                    |
| Mastery                  | уровень освоения                                                              |
| Mastery 0–4              | Пока не знаю · Читал · Применяю · Могу объяснить · Знаю внутреннее устройство |
| Fork                     | форк                                                                          |
| Profile                  | профиль                                                                       |
| Onboarding Questionnaire | анкета при настройке профиля                                                  |
| MCP Token                | MCP-токен                                                                     |
| External agent           | агент                                                                         |
