// Loaded only by the HTTP and browser fixture processes.
import { subscribe } from "node:diagnostics_channel";
subscribe("startodel.test.mail", (mail) => process.send?.({ mail }));
