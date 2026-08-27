import { Role } from '@prisma/client';

/** Shape attached to `req.user` by JwtStrategy once a request passes JwtAuthGuard. */
export type AuthenticatedUser = {
  id: string;
  address: string;
  role: Role;
};
