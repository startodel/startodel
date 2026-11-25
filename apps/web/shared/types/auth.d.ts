declare module "#auth-utils" {
  interface User {
    id: string;
    login: string;
    name: string | null;
    avatarUrl: string | null;
  }
}

export {};
