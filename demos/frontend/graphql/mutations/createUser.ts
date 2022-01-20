export const createUserMutationString = `
  mutation ($input: CreateUserInput!) {
    createUser (input: $input) {
      success
    }
  }
`;
