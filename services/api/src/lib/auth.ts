import jwt from "jsonwebtoken";
import { env } from "./env";

export type JwtUser = {
  sub: string;
  role: string;
  schoolId?: string | null;
  districtId?: string | null;
};

export function signToken(user: JwtUser) {
  return jwt.sign(user, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as JwtUser;
}
