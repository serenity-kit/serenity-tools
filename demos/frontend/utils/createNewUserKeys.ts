import sodium from "libsodium-wrappers";

export function createNewUserKeys() {
  const signingKeys = sodium.crypto_sign_keypair();
  const boxKeypair = sodium.crypto_box_keypair();
  return {
    sign: {
      privateKey: sodium.to_base64(signingKeys.privateKey),
      publicKey: sodium.to_base64(signingKeys.publicKey),
    },
    lockbox: {
      privateKey: sodium.to_base64(boxKeypair.privateKey),
      publicKey: sodium.to_base64(boxKeypair.publicKey),
    },
  };
}
