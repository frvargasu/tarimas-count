declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        username: string;
      };
    }
  }
}

export {};
