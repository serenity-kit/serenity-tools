import { getUserFromSession } from "./getUserFromSession";
import { prisma } from "./prisma";

export async function deleteOrganizationEventProposal(
  session: any,
  eventProposalId: string
) {
  const currentUser = await getUserFromSession(session);

  try {
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

    await prisma.eventProposal.delete({
      where: { id: eventProposalId },
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed");
  }
}
