import { prisma } from "./prisma";
import {
  DefaultTrustChainEvent,
  applyEvent,
  TrustChainState,
  EncryptedState,
  Lockbox,
} from "@serenity-tools/trust-chain";

export async function removeMemberFromOrganization(
  organizationId: string,
  event: DefaultTrustChainEvent,
  keyId: string,
  lockboxes: { [signingPublicKey: string]: Lockbox },
  // TODO could be made optional if the keyId is committed to the chain
  encryptedState: EncryptedState,
  eventProposalId?: string
) {
  try {
    return await prisma.$transaction(async (prisma) => {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (event.transaction.type !== "remove-member") {
        throw new Error("Not an remove-member event");
      }

      const newState = applyEvent(
        org.serializedState as TrustChainState,
        event
      );

      await prisma.key.create({ data: { id: keyId } });

      if (eventProposalId) {
        // verify that the eventPropsal and event transaction is identical
        await prisma.eventProposal.delete({
          where: { id: eventProposalId },
        });
      }

      // TODO move encryptedState.publicData.clock into Organization model
      const lastEncryptedStateEntryForThisOrg =
        await prisma.encryptedState.findFirst({
          where: { organizationId: org.id },
        });
      if (
        encryptedState.publicData.clock === undefined ||
        encryptedState.publicData.clock === null ||
        (lastEncryptedStateEntryForThisOrg &&
          encryptedState.publicData.clock <=
            // @ts-expect-error
            lastEncryptedStateEntryForThisOrg.publicData.clock)
      ) {
        throw new Error("EncryptedState clock not present or must increase");
      }

      const encryptedStateEntry = await prisma.encryptedState.findUnique({
        where: {
          organizationId_authorPublicSigningKey: {
            authorPublicSigningKey: encryptedState.author.publicKey, // TODO todo verify that this matches with the current authentication
            organizationId,
          },
        },
        include: { lockboxes: { select: { id: true } } },
      });

      return await prisma.organization.update({
        where: { id: org.id },
        data: {
          members: {
            disconnect: {
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
                  disconnect: encryptedStateEntry.lockboxes.map((lockbox) => ({
                    id: lockbox.id,
                  })),
                  create: Object.keys(lockboxes).map((key) => {
                    const lockbox = lockboxes[key];
                    return {
                      ciphertext: lockbox.ciphertext,
                      nonce: lockbox.nonce,
                      keyId,
                      senderLockboxPublicKey: lockbox.senderLockboxPublicKey,
                      receiverSigningPublicKey:
                        lockbox.receiverSigningPublicKey,
                    };
                  }),
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
                  create: Object.keys(lockboxes).map((key) => {
                    const lockbox = lockboxes[key];
                    return {
                      ciphertext: lockbox.ciphertext,
                      nonce: lockbox.nonce,
                      keyId,
                      senderLockboxPublicKey: lockbox.senderLockboxPublicKey,
                      receiverSigningPublicKey:
                        lockbox.receiverSigningPublicKey,
                    };
                  }),
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
