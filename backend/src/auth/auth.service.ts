import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { verifyMessage } from 'viem';
import { Env, parseAdminAddresses } from '../common/config/env.validation';
import { PrismaService } from '../common/prisma/prisma.service';
import { buildSignInMessage } from './utils/siwe-message.util';

const REFRESH_HASH_ROUNDS = 10;
const SIGN_IN_DOMAIN = 'BrickDAO';

type TokenPair = { accessToken: string; refreshToken: string };
type AccessTokenPayload = { sub: string; address: string; role: Role };

/**
 * Wallet-only authentication (sign-in-with-Ethereum style). This is the
 * single identity system for the app — BrickFi shipped a separate
 * email/password JWT system *and* a client-only wallet gate that never
 * talked to each other. Here the wallet signature is the only way in, and the
 * JWTs issued after it are tied to that wallet address.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  /** Step 1: create/find the user, mint a single-use nonce, hand back the message to sign. */
  async requestNonce(rawAddress: string): Promise<{ message: string }> {
    const address = rawAddress.toLowerCase();
    const adminAddresses = parseAdminAddresses(
      this.configService.get('ADMIN_WALLET_ADDRESSES', { infer: true }),
    );
    const nonce = randomUUID();

    const user = await this.prisma.user.upsert({
      where: { address },
      update: { nonce },
      create: {
        address,
        nonce,
        role: adminAddresses.has(address) ? Role.ADMIN : Role.USER,
      },
    });

    const message = buildSignInMessage({
      domain: SIGN_IN_DOMAIN,
      address: user.address,
      nonce: user.nonce,
      issuedAt: new Date().toISOString(),
    });

    return { message };
  }

  /** Step 2: verify the wallet actually signed that exact message, then issue tokens. */
  async verifySignature(
    rawAddress: string,
    message: string,
    signature: string,
  ) {
    const address = rawAddress.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { address } });
    if (!user) {
      throw new UnauthorizedException('Request a sign-in nonce first.');
    }

    // The nonce is single-use: if it doesn't match what's on file, this is
    // either a replay of an old signature or a stale request.
    if (!message.includes(`Nonce: ${user.nonce}`)) {
      throw new UnauthorizedException(
        'This sign-in request has expired — please try again.',
      );
    }

    const signatureIsValid = await verifyMessage({
      address: rawAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    if (!signatureIsValid) {
      throw new UnauthorizedException('Invalid wallet signature.');
    }

    const tokens = await this.issueTokenPair(user);
    await this.prisma.user.update({
      where: { id: user.id },
      // Rotate the nonce so this signed message can never be replayed again.
      data: {
        nonce: randomUUID(),
        refreshTokenHash: await this.hashToken(tokens.refreshToken),
      },
    });

    return { ...tokens, user: toPublicUser(user) };
  }

  async refresh(refreshToken: string) {
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        refreshToken,
        {
          secret: this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    const matchesStoredHash =
      user?.refreshTokenHash &&
      (await bcrypt.compare(refreshToken, user.refreshTokenHash));
    if (!user || !matchesStoredHash) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const tokens = await this.issueTokenPair(user);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: await this.hashToken(tokens.refreshToken) },
    });

    return { ...tokens, user: toPublicUser(user) };
  }

  /** Revokes the stored refresh token hash — the access token itself still has to expire naturally. */
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  private async issueTokenPair(user: User): Promise<TokenPair> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      address: user.address,
      role: user.role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.configService.get('JWT_ACCESS_TTL_SECONDS', {
          infer: true,
        }),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: this.configService.get('JWT_REFRESH_TTL_SECONDS', {
          infer: true,
        }),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, REFRESH_HASH_ROUNDS);
  }
}

function toPublicUser(user: User) {
  return { id: user.id, address: user.address, role: user.role };
}
