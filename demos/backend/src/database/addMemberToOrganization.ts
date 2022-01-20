import { prisma } from "./prisma";
import {
  DefaultTrustChainEvent,
  applyEvent,
  TrustChainState,
  Lockbox,
} from "@serenity-tools/trust-chain";

export async function addMemberToOrganization(
  organizationId: string,
  event: DefaultTrustChainEvent,
  keyId: string,
  lockbox: Lockbox,
  encryptedState: any,
  eventProposalId?: string
) {
  try {
    return await prisma.$transaction(async (prisma) => {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (event.transaction.type !== "add-member") {
        throw new Error("Not an add-member event");
      }

      const newState = applyEvent(
        org.serializedState as TrustChainState,
        event
      );

      if (eventProposalId) {
        // verify that the eventPropsal and event transaction is identical
        await prisma.eventProposal.delete({
          where: { id: eventProposalId },
        });
      }

      return await prisma.organization.update({
        where: { id: org.id },
        data: {
          members: {
            connect: {
              publicSigningKey: event.transaction.memberSigningPublicKey,
            },
          },
          serializedState: newState,
          lastEventHash: newState.lastEventHash,
          events: { create: { content: event } },
          encryptedStates: {
            upsert: {
              where: {
                organizationId_authorPublicSigningKey: {
                  authorPublicSigningKey: encryptedState.author.publicKey, // TODO todo verify that this matches with the current authentication
                  organizationId,
                },
              },
              update: {
                ciphertext: encryptedState.ciphertext,
                nonce: encryptedState.nonce,
                publicData: encryptedState.publicData,
                authorSignature: encryptedState.author.signature,
                key: { connect: { id: keyId } },
                lockboxes: {
                  create: {
                    ciphertext: lockbox.ciphertext,
                    nonce: lockbox.nonce,
                    keyId,
                    senderLockboxPublicKey: lockbox.senderLockboxPublicKey,
                    receiverSigningPublicKey: lockbox.receiverSigningPublicKey,
                  },
                },
              },
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
                  create: {
                    ciphertext: lockbox.ciphertext,
                    nonce: lockbox.nonce,
                    keyId,
                    senderLockboxPublicKey: lockbox.senderLockboxPublicKey,
                    receiverSigningPublicKey: lockbox.receiverSigningPublicKey,
                  },
                },
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
