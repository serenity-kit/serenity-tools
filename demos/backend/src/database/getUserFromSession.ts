import { AuthenticationError } from "apollo-server-express";
import { prisma } from "./prisma";

export async function getUserFromSession(session: any) {
  try {
    if (!session.userSigningPublicKey) {
      throw new AuthenticationError("Failed");
    }
    const currentUser = prisma.user.findUnique({
      where: { publicSigningKey: session.userSigningPublicKey },
    });
    if (!currentUser) {
      throw new AuthenticationError("Failed");
    }
    return currentUser;
  } catch (err) {
    console.error(err);
    throw new AuthenticationError("Failed");
  }
}
