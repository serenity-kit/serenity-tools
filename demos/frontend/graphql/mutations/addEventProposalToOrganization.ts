export const addEventProposalToOrganizationMutationString = `
  mutation ($input: AddEventProposalToOrganizationInput!) {
    addEventProposalToOrganization (input: $input) {
      success
    }
  }
`;
