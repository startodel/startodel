# Planned components

The roadmap has features with no interface yet. Their interface is built first, in the design system, so that a feature is assembled from components and does not invent its own. The showcase page `/design/planned` shows every one of them with sample data in Russian and English.

A planned component is a real `Ui*` component in `apps/web/app/components/ui/`. It takes props, emits events and renders every state the feature will need. It calls no API and holds no sample data. Nothing on a product page uses it until its feature ships.

Read [the design concept](CONCEPT.md) and [ADR 0017](../adr/0017-design-system.md) first.

## Components by roadmap issue

| Issue                                                   | Section          | Components                                                                                |
| ------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| [#82](https://github.com/startodel/startodel/issues/82) | Lesson blocks    | `UiLessonDiff`, `UiLessonDiagram`                                                         |
| [#52](https://github.com/startodel/startodel/issues/52) | Code practice    | `UiExerciseWorkbench`, `UiTestRunner`                                                     |
| [#54](https://github.com/startodel/startodel/issues/54) | Media and files  | `UiAttachment`, `UiUpload`, `UiStorageQuota`, `UiVideoFile`                               |
| [#48](https://github.com/startodel/startodel/issues/48) | Connected agent  | `UiAgentIdentity`, `UiAgentFit`                                                           |
| [#58](https://github.com/startodel/startodel/issues/58) | Block comments   | `UiBlockComments`, `UiFeedbackInbox`                                                      |
| [#58](https://github.com/startodel/startodel/issues/58) | Change proposals | `UiChangeProposal`, `UiChangeProposalList`                                                |
| [#56](https://github.com/startodel/startodel/issues/56) | Versions, export | `UiTrackVersions`, `UiTrackExport`, `UiTrackImport`                                       |
| [#53](https://github.com/startodel/startodel/issues/53) | Gated access     | `UiTrackAccess`, `UiTrackSyllabus`, `UiAccessRequest`, `UiAccessGrants`                   |
| [#59](https://github.com/startodel/startodel/issues/59) | Author analytics | `UiLearnerCounts`, `UiLearnerFunnel`, `UiDropOffList`, `UiMasteryStats`, `UiLearnerTable` |
| [#37](https://github.com/startodel/startodel/issues/37) | Points, ranking  | `UiPoints`, `UiLeaderboard`                                                               |

Issues without an interface of their own are left out: the MCP health view of #61 is an operator tool, #18 is an import through the agent, #19 is a page for a stream overlay, #20 changes who judges and not what the learner sees, #91 is a directory listing.

## What each part does

- **`UiLessonDiff`** compares two versions of a snippet, side by side or unified, as before and after or as bad and good. Changed lines carry an edge and a sign. With the language `text` it compares prose, which `UiChangeProposal` uses. `utils/line-diff.ts` computes the lines.
- **`UiLessonDiagram`** frames a diagram that arrives as inline SVG: title, caption as the text alternative, the source on request, a larger view, and the loading and failed states. It does not render Mermaid.
- **`UiLessonBlock`** now takes its own `kind` and `icon`, so a new Block type sits in the same frame.
- **`UiExerciseWorkbench`** places an editor beside its results and shows whether the attempt is saved. **`UiTestRunner`** lists each test with its result and shows the tally and the runtime.
- **`UiAttachment`**, **`UiUpload`** and **`UiStorageQuota`** cover a file through its upload, the drop zone and the Owner's storage. **`UiVideoFile`** is the plate of an uploaded video with its expired and locked states.
- **`UiAgentIdentity`** names the client that connected and when it was last active. **`UiAgentFit`** reads how the agent follows the guide as three steps with a shape and a word, with advice for each signal and a prompt to send.
- **`UiBlockComments`** is the thread of one Block. **`UiFeedbackInbox`** is the author's list of open comments by Lesson, with reply, resolve and a prompt for the agent.
- **`UiChangeProposal`** shows an edit from a Fork as a Block-level difference with Accept and Decline. **`UiChangeProposalList`** lists proposals by status.
- **`UiTrackVersions`** lists published versions with their notes. **`UiTrackExport`** and **`UiTrackImport`** move a Track as a file and report validation errors by path.
- **`UiTrackAccess`** says how a Track is shared. **`UiTrackSyllabus`** lists Topics and Lessons with locked and preview Lessons. **`UiAccessRequest`** is the visitor's panel. **`UiAccessGrants`** is the author's list of requests and grants.
- **`UiLearnerCounts`**, **`UiLearnerFunnel`**, **`UiDropOffList`**, **`UiMasteryStats`** and **`UiLearnerTable`** are the author's readouts. They use bars and words, no chart library.
- **`UiPoints`** and **`UiLeaderboard`** show points and a ranking without medals.

## Proposed terms

These concepts are not in [the glossary](../CONTEXT.md) yet. The components use the words below. The feature that introduces a concept adds it to the glossary and may still change the word.

| Concept                  | English UI                                  | Russian UI                                        |
| ------------------------ | ------------------------------------------- | ------------------------------------------------- |
| Comparison Block         | Comparison · Before, After · Bad, Good      | Сравнение · До, После · Плохо, Хорошо             |
| Diagram Block            | Diagram                                     | Схема                                             |
| Saved attempt            | Save attempt · Saved at                     | Сохранить попытку · Сохранено в                   |
| Test result              | passed, failed, not run                     | пройден, не пройден, не запущен                   |
| Storage                  | Storage · Almost full · Full                | Хранилище · Почти заполнено · Заполнено           |
| Block comment            | Unclear, Outdated, Broken link, Suggestion  | Непонятно, Устарело, Битая ссылка, Предложение    |
| Change proposal          | Change proposal · Accept, Decline, Withdraw | Предложение правки · Принять, Отклонить, Отозвать |
| Track version            | Version · Current · Publish                 | Версия · Текущая · Опубликовать                   |
| Export and import        | Single file, Folder for Git                 | Один файл, Папка для Git                          |
| Gated Track              | Private, Public, By request                 | Закрытый, Публичный, По доступу                   |
| Syllabus                 | Syllabus · Preview, Locked                  | Программа трека · Открыт, Закрыт                  |
| Access request and grant | Request access · Learners with access       | Запросить доступ · Ученики с доступом             |
| Learner                  | Learner                                     | Ученик                                            |
| Agent fit                | Works well, Needs attention, Poor fit       | Работает хорошо, Стоит поправить, Плохо подходит  |
| Funnel                   | Progression funnel · Biggest drop           | Воронка прохождения · Больше всего уходят здесь   |
| Points and ranking       | Points · Leaderboard                        | Очки · Рейтинг                                    |

## From specimen to feature

1. Wire the component to data on the page. Keep the sample data out of `components/ui`.
2. Add the feature's concepts to the glossary and settle the words in both catalogs.
3. Keep the content rules of [ADR 0014](../adr/0014-review-practice-and-ui-answers.md): a diagram is trusted SVG or is sanitised before it reaches the slot, and Markdown goes through `UiProse`.
4. Give the page a mock screen under `/design/screens` that renders the same components, as [ADR 0017](../adr/0017-design-system.md) and [the migration record](MIGRATION.md) describe.
5. Move the section from `/design/planned` to `/design/components` once the feature ships.

## Known limits

- `UiExerciseEditor` exposes no content, change or reset. The workbench specimen listens for input and clears the stored draft. The feature needs that API on the editor.
- `UiTestRunner` takes one `done` state and derives passed or failed from the tests.
- `UiUpload` does not filter a dropped file by `accept`. The caller checks type and size.
- `UiAccessGrants` and `UiLearnerTable` drop columns in a narrow container after mount, so a narrow first paint shows the wide table for a moment.
- File sizes use decimal units.
