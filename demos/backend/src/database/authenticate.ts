import { v4 as uuidv4 } from "uuid";
import sodium from "libsodium-wrappers";
import { prisma } from "./prisma";
import { verifySignature } from "@serenity-tools/trust-chain";
import { AuthenticationError } from "apollo-server-express";

export async function authenticate(
  signingPublicKey: string,
  nonce: string,
  nonceSignature: string,
  session: any
) {
  try {
    const validSignature = verifySignature(
      nonce,
      sodium.from_base64(nonceSignature),
      sodium.from_base64(signingPublicKey)
    );
    if (!validSignature) {
      throw new Error("Failed");
    }

    const authenticationChallenge =
      await prisma.authenticationChallenge.findUnique({ where: { nonce } });

    if (!authenticationChallenge) {
      throw new Error("Failed");
    }

    if (
      authenticationChallenge.userPublicSigningKey !== signingPublicKey ||
      authenticationChallenge.validUntil < new Date()
    ) {
      throw new Error("Failed");
    }

    await prisma.authenticationChallenge.delete({ where: { nonce } });

    session.userSigningPublicKey = signingPublicKey;
    return { success: true };
  } catch (err) {
    console.error(err);
    throw new Error("Failed");
  }
}
