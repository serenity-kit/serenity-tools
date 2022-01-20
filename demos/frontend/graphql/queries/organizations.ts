export const organizationsQueryString = `
  query ($signingPublicKey: String!) {
    organizations (signingPublicKey: $signingPublicKey) {
      id
      events {
        content
      }
      eventProposals {
        id
        content
      }
      encryptedStates {
        keyId
        ciphertext
        nonce
        publicData
        author {
          publicKey
          signature
        }
        lockbox {
          keyId
          receiverSigningPublicKey
          senderLockboxPublicKey
          ciphertext
          nonce
        }
      }
    }
  }
`;
