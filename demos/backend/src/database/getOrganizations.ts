import { canonicalize } from "@serenity-tools/trust-chain";
import { prisma } from "./prisma";

export async function getOrganizations(signingPublicKey: string) {
  try {
    const organizations = await prisma.organization.findMany({
      where: {
        members: { some: { publicSigningKey: { equals: signingPublicKey } } },
      },
      include: {
        events: { select: { content: true }, orderBy: { id: "asc" } },
        eventProposal: {
          select: { content: true, id: true },
          orderBy: { id: "asc" },
        },
        encryptedStates: {
          include: {
            lockboxes: {
              where: { receiverSigningPublicKey: signingPublicKey },
            },
          },
        },
      },
    });
    return organizations.map((organization) => {
      return {
        ...organization,
        events: organization.events.map((event) => {
          return {
            ...event,
            content: JSON.stringify(event.content),
          };
        }),
        eventProposals: organization.eventProposal.map((eventProposal) => {
          return {
            ...eventProposal,
            content: JSON.stringify(eventProposal.content),
          };
        }),
        encryptedStates: organization.encryptedStates.map((encryptedState) => {
          return {
            keyId: encryptedState.keyId,
            ciphertext: encryptedState.ciphertext,
            nonce: encryptedState.nonce,
            publicData: canonicalize(encryptedState.publicData),
            author: {
              publicKey: encryptedState.authorPublicSigningKey,
              signature: encryptedState.authorSignature,
            },
            lockbox: {
              keyId: encryptedState.lockboxes[0].keyId,
              ciphertext: encryptedState.lockboxes[0].ciphertext,
              receiverSigningPublicKey:
                encryptedState.lockboxes[0].receiverSigningPublicKey,
              senderLockboxPublicKey:
                encryptedState.lockboxes[0].senderLockboxPublicKey,
              nonce: encryptedState.lockboxes[0].nonce,
            },
          };
        }),
      };
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed");
  }
}
