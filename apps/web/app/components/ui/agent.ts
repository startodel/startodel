/** How well a connected agent follows the way Startodel teaches, overall or for one signal. */
export type AgentFitState = "good" | "attention" | "poor" | "unknown";

/** What the fit is read from: the agent's behaviour, never the name of a model. */
export const agentFitSignals = ["guide", "tools", "variety", "evidence"] as const;
export type AgentFitSignal = (typeof agentFitSignals)[number];
