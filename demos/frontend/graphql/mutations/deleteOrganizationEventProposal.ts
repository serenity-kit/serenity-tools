export const deleteOrganizationEventProposalMutationString = `
  mutation ($input: DeleteOrganizationEventProposalInput!) {
    deleteOrganizationEventProposal (input: $input) {
      success
    }
  }
`;
