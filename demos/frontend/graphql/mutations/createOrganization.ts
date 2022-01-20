export const createOrganizationMutationString = `
  mutation ($input: CreateOrganizationInput!) {
    createOrganization (input: $input) {
      success
    }
  }
`;
