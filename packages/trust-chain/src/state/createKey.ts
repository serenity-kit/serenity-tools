import { v4 as uuidv4 } from "uuid";
import sodium from "libsodium-wrappers";

export const createKey = (): { keyId: string; key: string } => {
  const key = sodium.crypto_secretbox_keygen();

  return {
    keyId: uuidv4(),
    key: sodium.to_base64(key),
  };
};
