import { prisma } from "./prisma";
import {
  DefaultTrustChainEvent,
  applyEvent,
  TrustChainState,
  Lockbox,
} from "@serenity-tools/trust-chain";
import { getUserFromSession } from "./getUserFromSession";

export async function addMemberToOrganization(
  session: any,
  organizationId: string,
  event: DefaultTrustChainEvent,
  keyId: string,
  lockbox: Lockbox,
  encryptedState: any,
  eventProposalId?: string
) {
  const currentUser = await getUserFromSession(session);
  if (encryptedState.author.publicKey !== currentUser.publicSigningKey) {
    throw new Error("Failed");
  }
  if (
    !event.authors.some(
      (author) => author.publicKey === currentUser.publicSigningKey
    )
  ) {
    throw new Error("Failed");
  }

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
        // TODO verify that the eventPropsal and event transaction is identical and the user has access to it
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
                  authorPublicSigningKey: encryptedState.author.publicKey,
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
                    publicSigningKey: encryptedState.author.publicKey,
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
