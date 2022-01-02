import sodium from "libsodium-wrappers";
import {
  DefaultTrustChainEvent,
  MemberAuthorization,
  UpdateMemberTransaction,
} from "./types";
import { hashTransaction } from "./utils";

export const updateMember = (
  prevHash: string,
  authorKeyPair: sodium.KeyPair,
  memberPublicKey: string,
  memberAuthorization: MemberAuthorization
): DefaultTrustChainEvent => {
  const transaction: UpdateMemberTransaction = {
    type: "update-member",
    memberPublicKey,
    ...memberAuthorization,
  };

  const hash = hashTransaction(transaction);
  return {
    authors: [
      {
        publicKey: sodium.to_base64(authorKeyPair.publicKey),
        signature: sodium.to_base64(
          sodium.crypto_sign_detached(
            `${prevHash}${hash}`,
            authorKeyPair.privateKey
          )
        ),
      },
    ],
    transaction,
    prevHash,
  };
};
