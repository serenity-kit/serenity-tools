export const authenticateMutationString = `
  mutation ($input: AuthenticateInput!) {
    authenticate (input: $input) {
      success
    }
  }
`;
