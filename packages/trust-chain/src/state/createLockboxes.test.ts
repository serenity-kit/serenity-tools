import sodium from "libsodium-wrappers";
import { addMember, createChain, resolveState } from "..";
import {
  getKeyPairA,
  getKeyPairB,
  getKeyPairC,
  getKeyPairsA,
  getKeyPairsB,
  getKeyPairsC,
  KeyPairs,
} from "../testUtils";
import { TrustChainState } from "../types";
import { hashTransaction } from "../utils";
import { createLockboxes } from "./createLockboxes";
import { decryptLockbox } from "./decryptLockbox";

let keyPairA: sodium.KeyPair = null;
let keyPairsA: KeyPairs = null;
let keyPairB: sodium.KeyPair = null;
let keyPairsB: KeyPairs = null;
let keyPairsC: KeyPairs = null;
let state: TrustChainState = null;

beforeAll(async () => {
  await sodium.ready;
  keyPairA = getKeyPairA();
  keyPairsA = getKeyPairsA();
  keyPairB = getKeyPairB();
  keyPairsB = getKeyPairsB();
  keyPairsC = getKeyPairsC();

  const createEvent = createChain(keyPairsA.sign, {
    [keyPairsA.sign.publicKey]: keyPairsA.box.publicKey,
  });
  const addMemberEvent = addMember(
    hashTransaction(createEvent.transaction),
    keyPairA,
    keyPairsB.sign.publicKey,
    keyPairsB.box.publicKey,
    { isAdmin: false, canAddMembers: true, canRemoveMembers: false }
  );
  const addMemberEvent2 = addMember(
    hashTransaction(addMemberEvent.transaction),
    keyPairB,
    keyPairsC.sign.publicKey,
    keyPairsC.box.publicKey,
    { isAdmin: false, canAddMembers: false, canRemoveMembers: false }
  );
  state = resolveState([createEvent, addMemberEvent, addMemberEvent2]);
});

test.only("should create valid lockboxes", async () => {
  const key = {
    key: "3luB8v0t9n8a6QwgLYXl3Ib98wCqWqdOcxRU2bU7cy4",
    keyId: "182ce6ae-369d-48e0-b615-9a12fb9dfc75",
  };
  const result = createLockboxes(
    key,
    keyPairsA.box.privateKey,
    keyPairsA.box.publicKey,
    state
  );

  const decrypedResulA = decryptLockbox(
    keyPairsA.box.privateKey,
    result.lockboxes[keyPairsA.sign.publicKey]
  );
  expect(decrypedResulA).toMatchInlineSnapshot(`
    Object {
      "key": "3luB8v0t9n8a6QwgLYXl3Ib98wCqWqdOcxRU2bU7cy4",
      "keyId": "182ce6ae-369d-48e0-b615-9a12fb9dfc75",
    }
  `);

  const decrypedResultB = decryptLockbox(
    keyPairsB.box.privateKey,
    result.lockboxes[keyPairsB.sign.publicKey]
  );
  expect(decrypedResultB).toMatchInlineSnapshot(`
    Object {
      "key": "3luB8v0t9n8a6QwgLYXl3Ib98wCqWqdOcxRU2bU7cy4",
      "keyId": "182ce6ae-369d-48e0-b615-9a12fb9dfc75",
    }
  `);

  const decrypedResultC = decryptLockbox(
    keyPairsC.box.privateKey,
    result.lockboxes[keyPairsC.sign.publicKey]
  );
  expect(decrypedResultC).toMatchInlineSnapshot(`
    Object {
      "key": "3luB8v0t9n8a6QwgLYXl3Ib98wCqWqdOcxRU2bU7cy4",
      "keyId": "182ce6ae-369d-48e0-b615-9a12fb9dfc75",
    }
  `);
});
