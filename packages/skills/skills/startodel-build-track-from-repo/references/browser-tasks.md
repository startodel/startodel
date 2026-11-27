# Browser tasks and timers

This worked Lesson uses all seven Block types. The snippet runs in a browser console.

```json
[
  {
    "type": "theory",
    "id": "tasks",
    "markdown": "You’re testing two messages in the browser console. One comes from a timer set for zero milliseconds. The other comes from the last line of the snippet."
  },
  {
    "type": "code",
    "id": "order",
    "language": "js",
    "code": "function report() {\n  console.log('timer');\n}\nsetTimeout(report, 0);\nconsole.log('sync');"
  },
  {
    "type": "callout",
    "id": "prediction",
    "variant": "tip",
    "markdown": "Which message will you see first? Pick an order, then run the snippet."
  },
  {
    "type": "theory",
    "id": "order-trace",
    "markdown": "The console shows `sync` first. Start at `setTimeout(report, 0)`. That line asks the browser to call `report` later. The browser finishes its current piece of work, called a *task*. That includes the last line, which prints `sync`. Even if the delay has already passed, the timer waits for this task to finish. The browser can then call `report`, which prints `timer`."
  },
  {
    "type": "callout",
    "id": "latency",
    "variant": "production",
    "markdown": "A progress indicator stops moving while the page parses a large file in one task. Its timer has to wait. Record the import in the browser’s Performance panel and look for a task that lasts as long as the pause. Try parsing a smaller chunk per task, then record the same import again."
  },
  {
    "type": "link",
    "id": "docs",
    "title": "WHATWG HTML Living Standard: Event loop processing model",
    "url": "https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model",
    "note": "Accessed 27 November 2026. In the processing steps, find where the browser runs the task it just selected. Follow the loop back to where it chooses the next one."
  },
  {
    "type": "video",
    "id": "talk",
    "title": "What the heck is the event loop anyway?",
    "url": "https://www.youtube.com/watch?v=8aGhZQkoFbQ",
    "note": "Watch how Philip Roberts draws a timer waiting while other code runs in this 2014 talk. The linked HTML standard gives the current rules."
  },
  {
    "type": "quiz",
    "id": "timers",
    "questions": [
      {
        "prompt": "Suppose you set the timer for 10 milliseconds, then spend 80 milliseconds parsing a file in the same task just before the last log. Which message appears first?",
        "options": ["timer", "sync"],
        "correctIndex": 1,
        "explanation": "The 10 milliseconds pass while the browser is still parsing. It finishes the file and prints `sync` in the current task. Only then can it run `report`."
      }
    ]
  },
  {
    "type": "exercise",
    "id": "trace",
    "prompt": "A counter starts at 0. A timer adds 1 to it. The line just after `setTimeout` saves the counter. Where would you move the save so it always records 1? Trace both versions.",
    "solution": "At first the save runs in the current task, while the counter is still 0. Move the save inside the timer function, just after it adds 1. Whenever the timer runs, the counter now changes before the save reads it.",
    "hints": ["Which line first has the value you want to save?"]
  }
]
```
