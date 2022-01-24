import { canonicalize } from "@serenity-tools/trust-chain";
import { getUserFromSession } from "./getUserFromSession";
import { prisma } from "./prisma";

export async function getOrganizations(signingPublicKey: string, session: any) {
  const currentUser = await getUserFromSession(session);
  if (signingPublicKey !== currentUser.publicSigningKey) {
    throw new Error("Failed");
  }

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
            key: {
              include: {
                lockbox: {
                  where: { receiverSigningPublicKey: signingPublicKey },
                },
              },
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
              keyId: encryptedState.key.lockbox[0].keyId,
              ciphertext: encryptedState.key.lockbox[0].ciphertext,
              receiverSigningPublicKey:
                encryptedState.key.lockbox[0].receiverSigningPublicKey,
              senderLockboxPublicKey:
                encryptedState.key.lockbox[0].senderLockboxPublicKey,
              nonce: encryptedState.key.lockbox[0].nonce,
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
