export const removeMemberFromOrganizationMutationString = `
  mutation ($input: RemoveMemberFromOrganizationInput!) {
    removeMemberFromOrganization (input: $input) {
      success
    }
  }
`;
