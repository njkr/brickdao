import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Env } from '../../common/config/env.validation';
import { AuthenticatedUser } from '../types/authenticated-user.type';

type AccessTokenPayload = {
  sub: string;
  address: string;
  role: AuthenticatedUser['role'];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  // Runs only after the signature + expiry above already checked out.
  validate(payload: AccessTokenPayload): AuthenticatedUser {
    return { id: payload.sub, address: payload.address, role: payload.role };
  }
}
