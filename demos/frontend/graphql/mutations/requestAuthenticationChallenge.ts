export const requestAuthenticationChallengeMutationString = `
  mutation ($input: RequestAuthenticationChallengeInput!) {
    requestAuthenticationChallenge (input: $input) {
      nonce
    }
  }
`;
