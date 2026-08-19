// src/shared/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string | null;
        organizationId: string;
        roles: {
          id: string;
          name: string;
          permissions: {
            id: string;
            name: string;
          }[];
        }[];
        profile: {
          id: string;
          fullName: string;
          email: string | null;
          phone: string | null;
          photoUrl: string | null;
          employeeNumber: string | null;
          registrationNumber: string | null;
          branch: {
            id: string;
            name: string;
            code: string;
          } | null;
          type: string | null;
        } | null;
        profileType: string | null;
        sessionId: string;
      };
    }
  }
}

export {};