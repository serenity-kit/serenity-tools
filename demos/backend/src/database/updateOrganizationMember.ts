import { prisma } from "./prisma";
import {
  DefaultTrustChainEvent,
  applyEvent,
  TrustChainState,
} from "@serenity-tools/trust-chain";
import { getUserFromSession } from "./getUserFromSession";

export async function updateOrganizationMember(
  session: any,
  organizationId: string,
  event: DefaultTrustChainEvent,
  eventProposalId?: string
) {
  const currentUser = await getUserFromSession(session);
  if (
    !event.authors.some(
      (author) => author.publicKey === currentUser.publicSigningKey
    )
  ) {
    throw new Error("Failed");
  }

  try {
    return await prisma.$transaction(async (prisma) => {
      // verify the user has access to this organization
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (event.transaction.type !== "update-member") {
        throw new Error("Not an update-member event");
      }

      const newState = applyEvent(
        org.serializedState as TrustChainState,
        event
      );

      if (eventProposalId) {
        // TODO verify that the eventPropsal and event transaction is identical and the user has access to it's organization
        await prisma.eventProposal.delete({
          where: { id: eventProposalId },
        });
      }

      return await prisma.organization.update({
        where: { id: org.id },
        data: {
          serializedState: newState,
          lastEventHash: newState.lastEventHash,
          events: { create: { content: event } },
        },
      });
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed");
  }
}
