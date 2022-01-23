import { v4 as uuidv4 } from "uuid";
import sodium from "libsodium-wrappers";
import { Key } from "../types";

export const createKey = (): Key => {
  const key = sodium.crypto_secretbox_keygen();

  return {
    keyId: uuidv4(),
    key: sodium.to_base64(key),
  };
};
