export const addMemberToOrganizationMutationString = `
  mutation ($input: AddMemberToOrganizationInput!) {
    addMemberToOrganization (input: $input) {
      success
    }
  }
`;
