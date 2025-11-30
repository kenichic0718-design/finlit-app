// lib/prisma.ts

// このプロジェクトでは実際に Prisma は使用していないが、
// 既存コードとの互換のためにダミーの PrismaClient を定義しておく。
class PrismaClientPlaceholder {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(..._args: unknown[]) {}
}

export type PrismaClient = PrismaClientPlaceholder;

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma__ ?? (new PrismaClientPlaceholder() as PrismaClient);

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}

export default prisma;
