import { prisma } from "./prisma";
import {
  DefaultTrustChainEvent,
  applyEvent,
  TrustChainState,
} from "@serenity-tools/trust-chain";

export async function updateOrganizationMember(
  organizationId: string,
  event: DefaultTrustChainEvent,
  eventProposalId?: string
) {
  try {
    return await prisma.$transaction(async (prisma) => {
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
        // verify that the eventPropsal and event transaction is identical
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
