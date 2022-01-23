import { prisma } from "./prisma";
import {
  CreateChainTrustChainEvent,
  EncryptedState,
  Lockbox,
  resolveState,
} from "@serenity-tools/trust-chain";

export async function createOrganization(
  event: CreateChainTrustChainEvent,
  keyId: string,
  lockboxes: { [signingPublicKey: string]: Lockbox },
  encryptedState: EncryptedState
) {
  try {
    const state = resolveState([event]);

    return await prisma.$transaction(async (prisma) => {
      await prisma.key.create({ data: { id: keyId } });

      const memberKeys = Object.keys(state.members);

      // TODO move encryptedState.publicData.clock into Organization model
      if (
        encryptedState.publicData.clock === undefined ||
        encryptedState.publicData.clock === null
      ) {
        throw new Error("EncryptedState clock not present");
      }

      await prisma.organization.create({
        data: {
          id: state.id,
          members: {
            // TODO change to connect only
            connectOrCreate: memberKeys.map((publicSigningKey) => ({
              where: { publicSigningKey },
              create: { publicSigningKey },
            })),
          },
          events: { create: { content: event } },
          lastEventHash: state.lastEventHash,
          serializedState: state,
          encryptedStates: {
            create: {
              ciphertext: encryptedState.ciphertext,
              nonce: encryptedState.nonce,
              publicData: encryptedState.publicData,
              author: {
                connect: {
                  publicSigningKey: encryptedState.author.publicKey, // TODO todo verify that this matches with the current authentication
                },
              },
              authorSignature: encryptedState.author.signature,
              key: { connect: { id: keyId } },
              lockboxes: {
                create: Object.keys(lockboxes).map((key) => {
                  const lockbox = lockboxes[key];
                  return {
                    ciphertext: lockbox.ciphertext,
                    nonce: lockbox.nonce,
                    keyId,
                    senderLockboxPublicKey: lockbox.senderLockboxPublicKey,
                    receiverSigningPublicKey: lockbox.receiverSigningPublicKey,
                  };
                }),
              },
            },
          },
        },
      });
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed");
  }
}
