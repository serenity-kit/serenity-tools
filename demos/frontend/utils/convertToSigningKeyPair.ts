import { KeyPairBase64 } from "@serenity-tools/trust-chain";
import sodium from "libsodium-wrappers";

export function convertToSigningKeyPair(props: KeyPairBase64): sodium.KeyPair {
  return {
    privateKey: sodium.from_base64(props.privateKey),
    publicKey: sodium.from_base64(props.publicKey),
    keyType: "ed25519",
  };
}
