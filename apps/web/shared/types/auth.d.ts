declare module "#auth-utils" {
  interface SecureSessionData {
    githubLinkState?: string;
  }
  interface User {
    id: string;
    login: string;
    name: string | null;
    avatarUrl: string | null;
  }
}

export {};
