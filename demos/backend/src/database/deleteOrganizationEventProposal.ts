import { prisma } from "./prisma";

export async function deleteOrganizationEventProposal(eventProposalId: string) {
  try {
    // TODO validate access
    return await prisma.eventProposal.delete({
      where: { id: eventProposalId },
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed");
  }
}
