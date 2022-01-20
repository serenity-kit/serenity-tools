import { prisma } from "./prisma";
import { DefaultTrustChainEvent } from "@serenity-tools/trust-chain";

export async function addEventProposalToOrganization(
  organizationId: string,
  event: DefaultTrustChainEvent
) {
  try {
    return await prisma.$transaction(async (prisma) => {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      return await prisma.organization.update({
        where: { id: org.id },
        data: {
          eventProposal: { create: { content: event } },
        },
      });
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed");
  }
}
