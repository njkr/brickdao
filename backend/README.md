# BrickDAO Backend

REST API for BrickDAO, a tokenized real estate platform. It handles wallet-based sign-in, serves property listings, and stores each investor's transactions and portfolio. The on-chain side (the `AssetFactory` ERC-1155 contract) lives in [`../contracts`](../contracts) and the web app in [`../frontend`](../frontend); see the [root README](../README.md) for the full picture.

![Swagger UI](../docs/screenshots/03-api-docs.png)

## Stack

NestJS 11, Prisma 6 with PostgreSQL 16, `viem` for signature verification, `@nestjs/jwt` + Passport, `@nestjs/throttler`, `helmet`, `class-validator` DTOs, `zod` environment validation, Swagger.

## Modules

| Module | Folder | Responsibility |
| --- | --- | --- |
| App | `src/app.*` | `GET /health` |
| Auth | `src/auth` | Nonce issuing, signature verification, JWT access/refresh tokens, logout |
| Users | `src/users` | `GET /users/me` for the signed-in wallet |
| Properties | `src/properties` | Public listing/detail endpoints; admin-only create, update, delete |
| Finance | `src/finance` | Cards, bank accounts, transactions and the portfolio summary, always scoped to the signed-in user |
| Common | `src/common` | Zod env validation, Prisma service, JWT and role guards, decorators, HTTP exception filter |

## Wallet sign-in flow

There are no passwords. A wallet proves it controls an address by signing a message that contains a single-use nonce.

1. `POST /auth/nonce` with `{ "address": "0x..." }`. The API creates the user if needed, stores a fresh nonce, and returns the message to sign (modelled on EIP-4361: domain, address, nonce, issued-at).
2. The wallet signs that message (`personal_sign`). This costs no gas.
3. `POST /auth/verify` with `{ address, message, signature }`. The API checks that the message contains the stored nonce, verifies the signature with `viem`, rotates the nonce so the same signed message can never be replayed, and returns `{ accessToken, refreshToken, user }`.
4. Send `Authorization: Bearer <accessToken>` on protected routes. When it expires, `POST /auth/refresh` with the refresh token returns a new pair. Refresh tokens are stored hashed (bcrypt) and `POST /auth/logout` revokes them.

Admin is a server-side role. Addresses listed in `ADMIN_WALLET_ADDRESSES` receive the `ADMIN` role, and `RolesGuard` enforces it on the mutating property endpoints. No endpoint accepts a client-supplied user id; every finance route derives the user from the JWT.

## API endpoints

Interactive documentation is served at `http://localhost:4000/docs`.

| Method | Path | Description | Access |
| --- | --- | --- | --- |
| GET | `/health` | Liveness check | Public |
| POST | `/auth/nonce` | Request a sign-in message for an address | Public (rate limited) |
| POST | `/auth/verify` | Verify a signature, receive tokens | Public (rate limited) |
| POST | `/auth/refresh` | Exchange a refresh token for a new pair | Public (rate limited) |
| POST | `/auth/logout` | Revoke the stored refresh token | JWT |
| GET | `/users/me` | Current user (`id`, `address`, `role`) | JWT |
| GET | `/properties` | List properties. Query: `search`, `status`, `minPrice`, `maxPrice`, `location` | Public |
| GET | `/properties/:id` | Property detail with documents | Public |
| POST | `/properties` | Create a property | JWT + ADMIN |
| PATCH | `/properties/:id` | Update a property | JWT + ADMIN |
| DELETE | `/properties/:id` | Delete a property | JWT + ADMIN |
| GET | `/finance/cards` | List the user's cards | JWT |
| POST | `/finance/cards` | Add a card (stores brand, last 4 digits, expiry, name only) | JWT |
| GET | `/finance/banks` | List the user's bank accounts | JWT |
| POST | `/finance/banks` | Add a bank account (stores bank name, last 4 digits, routing) | JWT |
| GET | `/finance/transactions` | List the user's transactions, optionally by type | JWT |
| POST | `/finance/transactions` | Record a `PURCHASE` or `YIELD` event, optionally with a `txHash` | JWT |
| GET | `/finance/portfolio` | Holdings and total invested, derived from transactions | JWT |

Rate limits: 100 requests per minute per client globally, and 10 per minute on `/auth/nonce`, `/auth/verify` and `/auth/refresh`. Request bodies are validated with `class-validator`, unknown properties are rejected, and `helmet` plus an explicit CORS allowlist (`CORS_ORIGINS`) are enabled.

## Data model (Prisma)

Defined in `prisma/schema.prisma`; migrations are in `prisma/migrations`.

| Model | Table | Notes |
| --- | --- | --- |
| `User` | `users` | `address` (unique wallet), `role` (`USER` / `ADMIN`), current `nonce`, hashed refresh token |
| `Property` | `properties` | Listing data (title, location, price, `tokenPrice`, `totalTokens`, `tokensSold`, `status`, features, `returnRate`) plus `contractAddress` and `tokenId` linking it to the ERC-1155 token |
| `PropertyDocument` | `property_documents` | Named document links attached to a property |
| `Transaction` | `transactions` | `PURCHASE` or `YIELD` for a user and property, with `tokens`, `value` and optional `txHash` |
| `Card` | `cards` | Brand, last 4 digits, expiry, name; never a full card number |
| `BankAccount` | `bank_accounts` | Bank name, last 4 digits, routing |

Enums: `Role` (`USER`, `ADMIN`), `PropertyStatus` (`AVAILABLE`, `SOLD_OUT`, `COMING_SOON`), `TransactionType` (`PURCHASE`, `YIELD`).

## Setup

Prerequisites: Node.js 20+, Docker.

```bash
docker compose up -d            # PostgreSQL 16 (user/password/db: postgres/postgres/brickdao) on port 5432
npm install
cp .env.example .env            # then edit, see below
npx prisma migrate deploy       # apply the existing migrations
npm run db:seed                 # six sample properties and the admin wallet(s)
npm run start:dev               # http://localhost:4000
```

If `prisma migrate` or the seed complain about missing types after a fresh install, run `npm run prisma:generate` once.

To stop the database: `docker compose stop`. `docker compose down -v` also deletes the data volume.

The seed assigns token ids 1 to 6 to the sample properties and sets `contractAddress` from `ASSET_FACTORY_ADDRESS` if it is set. Properties that already exist are skipped, so set the variable before the first seed, or edit `contractAddress` afterwards (admin panel, Prisma Studio or `PATCH /properties/:id`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Start with file watching |
| `npm run start` | Start without watching |
| `npm run build` | Compile to `dist/` |
| `node dist/src/main` | Run the compiled build (the `npm run start:prod` script points at `dist/main`, which is not where the build writes its output) |
| `npm run lint` | ESLint (auto-fixes) |
| `npm run format` | Prettier |
| `npm test` | Unit tests (Jest) |
| `npm run test:cov` | Unit tests with coverage |
| `npm run test:e2e` | End-to-end tests |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create/apply migrations in development (`prisma migrate dev`) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed properties and admin wallets |

## Environment variables

Validated with zod at boot. The app refuses to start if a required value is missing or malformed. Copy `.env.example` to `.env`.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5432/brickdao` |
| `JWT_ACCESS_SECRET` | yes | | Access-token signing secret, at least 16 characters |
| `JWT_REFRESH_SECRET` | yes | | Refresh-token signing secret, at least 16 characters |
| `PORT` | no | `4000` | HTTP port |
| `CORS_ORIGINS` | no | `http://localhost:3000` | Comma-separated allowed origins |
| `JWT_ACCESS_TTL_SECONDS` | no | `900` | Access-token lifetime |
| `JWT_REFRESH_TTL_SECONDS` | no | `604800` | Refresh-token lifetime |
| `ADMIN_WALLET_ADDRESSES` | no | empty | Comma-separated, lowercase wallet addresses that get the ADMIN role |
| `ASSET_FACTORY_ADDRESS` | no | | Used only by the seed script to attach seeded properties to a deployed contract |

Generate the secrets with `openssl rand -hex 32`.

## Related

- [Root README](../README.md): architecture and the full local setup
- [Frontend README](../frontend/README.md)
- [Contracts README](../contracts/README.md)
