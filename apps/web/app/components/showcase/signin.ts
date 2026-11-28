import type { EmailActions } from "../../composables/useEmailChallenge";
export const specimenEmailActions: EmailActions = {
  request: async () => ({ id: "sample" }),
  verify: async () => ({ ok: true }),
};
