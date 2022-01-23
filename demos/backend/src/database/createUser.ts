import { prisma } from "./prisma";

export async function createUser(signingPublicKey: string) {
  return await prisma.user.create({
    data: { publicSigningKey: signingPublicKey },
  });
}
