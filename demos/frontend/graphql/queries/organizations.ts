export const organizationsQueryString = `
  query {
    organizations {
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
