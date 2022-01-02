import sodium from "libsodium-wrappers";
import { InvalidTrustChainError } from "./errors";
import { createChain, resolveState, addMember } from "./index";
import { getKeyPairA, getKeyPairB, getKeyPairC } from "./testUtils";
import { hashTransaction } from "./utils";

let keyPairA: sodium.KeyPair = null;
let keyPairB: sodium.KeyPair = null;
let keyPairC: sodium.KeyPair = null;

beforeAll(async () => {
  await sodium.ready;
  keyPairA = getKeyPairA();
  keyPairB = getKeyPairB();
  keyPairC = getKeyPairC();
});

test("should fail in case the chain is not correctly ordered", async () => {
  const createEvent = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
  ]);
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    sodium.to_base64(keyPairB.publicKey),
    { isAdmin: false, canAddMembers: true, canRemoveMembers: false }
  );
  const addMemberEvent2 = addMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairB,
    sodium.to_base64(keyPairC.publicKey),
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  const chain = [createEvent, addMemberEvent2, addMemberEvent];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow(
    "Invalid signature for MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY."
  );
});
