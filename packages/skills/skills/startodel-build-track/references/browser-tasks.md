# Browser tasks and timers

Use this worked Lesson to check how the Blocks fit together. Run the snippet in a browser console and predict the order before reading the explanation.

```json
[
  {
    "type": "theory",
    "id": "tasks",
    "markdown": "Think of the main thread as one person finishing a phone call. A timer makes a callback eligible for a later task. It cannot take over a stack that is still executing. Predict which log will appear first."
  },
  {
    "type": "code",
    "id": "order",
    "language": "js",
    "code": "setTimeout(() => console.log('timer'), 0);\nconsole.log('sync');",
    "explanation": "The synchronous log runs before the queued timer."
  },
  {
    "type": "callout",
    "id": "latency",
    "variant": "production",
    "markdown": "While an import parses a large file on the main thread, both a progress timer and clicks appear to freeze. Lowering the timer delay leaves the parser on the stack. Check the long task in a performance trace, move parsing to a worker, then repeat the same import and compare input latency."
  },
  {
    "type": "link",
    "id": "docs",
    "title": "HTML Living Standard — event loop processing model",
    "url": "https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model",
    "note": "26 November 2026 edition. Trace the selected task through execution to the microtask checkpoint."
  },
  {
    "type": "video",
    "id": "talk",
    "title": "What the heck is the event loop anyway?",
    "url": "https://www.youtube.com/watch?v=8aGhZQkoFbQ",
    "note": "In this 2014 talk, Philip Roberts demonstrates the stack and queue in his own visualizer. Use the linked HTML standard for the current algorithm."
  },
  {
    "type": "quiz",
    "id": "timers",
    "questions": [
      {
        "prompt": "Suppose a slow synchronous parser runs just before the last log. The timer delay expires during parsing. Which message still appears first?",
        "options": ["timer", "sync"],
        "correctIndex": 1,
        "explanation": "Timer expiry makes the callback eligible. The parser and the sync log still run in the current task before the timer can run."
      }
    ]
  },
  {
    "type": "exercise",
    "id": "trace",
    "prompt": "Add Promise.resolve().then(() => console.log('micro')) after scheduling the timer. Predict the three logs, run it, and explain why the timer cannot overtake the Promise callback.",
    "solution": "sync, micro, timer. The stack empties, the microtask checkpoint runs the Promise callback, and only then can the event loop select the timer task.",
    "hints": ["When does the microtask queue drain?"]
  }
]
```
