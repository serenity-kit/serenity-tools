import { prisma } from "./prisma";
import { DefaultTrustChainEvent } from "@serenity-tools/trust-chain";
import { getUserFromSession } from "./getUserFromSession";

export async function updateOrganizationEventProposal(
  session: any,
  eventProposalId: string,
  event: DefaultTrustChainEvent
) {
  try {
    const currentUser = await getUserFromSession(session);
    if (
      !event.authors.some(
        (author) => author.publicKey === currentUser.publicSigningKey
      )
    ) {
      throw new Error("Failed");
    }

    const eventProposal = await prisma.eventProposal.findUnique({
      where: { id: eventProposalId },
      include: {
        organization: {
          select: {
            members: {
              where: { publicSigningKey: currentUser.publicSigningKey },
            },
          },
        },
      },
    });
    if (eventProposal.organization.members.length === 0) {
      throw new Error("Failed");
    }

    // TODO event validation
    return await prisma.eventProposal.update({
      where: { id: eventProposalId },
      data: { content: event },
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed");
  }
}
