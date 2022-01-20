export const updateOrganizationMemberMutationString = `
  mutation ($input: UpdateOrganizationMemberInput!) {
    updateOrganizationMember (input: $input) {
      success
    }
  }
`;
