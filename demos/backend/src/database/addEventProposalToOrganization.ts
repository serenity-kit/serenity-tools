import { prisma } from "./prisma";
import { DefaultTrustChainEvent } from "@serenity-tools/trust-chain";
import { getUserFromSession } from "./getUserFromSession";

export async function addEventProposalToOrganization(
  session: any,
  organizationId: string,
  event: DefaultTrustChainEvent
) {
  const currentUser = await getUserFromSession(session);

  try {
    return await prisma.$transaction(async (prisma) => {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          members: {
            where: { publicSigningKey: currentUser.publicSigningKey },
          },
        },
      });

      if (org.members.length === 0) {
        throw new Error("Failed");
      }

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
