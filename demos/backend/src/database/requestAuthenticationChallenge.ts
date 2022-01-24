import { v4 as uuidv4 } from "uuid";
import { prisma } from "./prisma";

export async function requestAuthenticationChallenge(signingPublicKey: string) {
  try {
    const nonce = `server-auth-${uuidv4()}`;
    const validUntil = new Date();
    validUntil.setSeconds(validUntil.getSeconds() + 60);
    return await prisma.authenticationChallenge.create({
      data: {
        nonce,
        user: { connect: { publicSigningKey: signingPublicKey } },
        validUntil,
      },
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed");
  }
}
