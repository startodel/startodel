declare module "#auth-utils" {
  interface SecureSessionData {
    githubLinkState?: string;
    oauthPending?: { id: string; expires: number } | null;
  }
  interface User {
    id: string;
    login: string;
    name: string | null;
    avatarUrl: string | null;
  }
}

export {};
