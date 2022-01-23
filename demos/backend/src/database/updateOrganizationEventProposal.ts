import { prisma } from "./prisma";
import { DefaultTrustChainEvent } from "@serenity-tools/trust-chain";

export async function updateOrganizationEventProposal(
  eventProposalId: string,
  event: DefaultTrustChainEvent
) {
  try {
    // TODO validate access
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
