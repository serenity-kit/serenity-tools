import { v4 as uuidv4 } from "uuid";
import sodium from "libsodium-wrappers";
import { CreateChainTransaction, CreateChainTrustChainEvent } from "./types";
import { hashTransaction } from "./utils";

export const createChain = (
  authorKeyPair: sodium.KeyPair,
  admins: string[]
): CreateChainTrustChainEvent => {
  const transaction: CreateChainTransaction = {
    type: "create",
    id: uuidv4(),
    admins,
  };
  const hash = hashTransaction(transaction);
  return {
    transaction,
    authors: [
      {
        publicKey: sodium.to_base64(authorKeyPair.publicKey),
        signature: sodium.to_base64(
          sodium.crypto_sign_detached(hash, authorKeyPair.privateKey)
        ),
      },
    ],
    prevHash: null,
  };
};
