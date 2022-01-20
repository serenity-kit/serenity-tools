import sodium from "libsodium-wrappers";
import { createChain, InvalidEncryptedStateError, resolveState } from "..";
import { getKeyPairA, getKeyPairsA, KeyPairs } from "../testUtils";
import { createKey } from "./createKey";
import { encryptState } from "./encryptState";
import { resolveEncryptedState } from "./resolveEncryptedState";

let keyPairA: sodium.KeyPair = null;
let keyPairsA: KeyPairs = null;
let keyPairAPublicKey: string = null;

beforeAll(async () => {
  await sodium.ready;
  keyPairA = getKeyPairA();
  keyPairsA = getKeyPairsA();
  keyPairAPublicKey = sodium.to_base64(keyPairA.publicKey);
});

test("should add the name to the user", async () => {
  const key = createKey();
  const event = createChain(keyPairsA.sign, {
    [keyPairsA.sign.publicKey]: keyPairsA.box.publicKey,
  });
  const state = resolveState([event]);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairAPublicKey]: { name: "Jane Doe" } } },
    key,
    keyPairA
  );

  const keys = { [key.keyId]: key.key };
  // TODO order encyrpted states by the clock
  const result = resolveEncryptedState(
    state,
    [encryptedState],
    keys,
    keyPairsA.sign.publicKey
  );
  expect(result.state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
        "lockboxPublicKey": "wevxDsZ-L7wpy3ePZcQNfG8WDh0wB0d27phr5OMdLwI",
        "name": "Jane Doe",
        "profileUpdatedBy": "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
      },
    }
  `);
});

test("should overwrite the name", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };
  const event = createChain(keyPairsA.sign, {
    [keyPairsA.sign.publicKey]: keyPairsA.box.publicKey,
  });
  const state = resolveState([event]);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairAPublicKey]: { name: "Jane Doe" } } },
    key,
    keyPairA
  );
  const result2 = resolveEncryptedState(
    state,
    [encryptedState],
    keys,
    keyPairsA.sign.publicKey
  );
  const encryptedState2 = encryptState(
    result2.state,
    { members: { [keyPairAPublicKey]: { name: "John Doe" } } },
    key,
    keyPairA
  );

  const result3 = resolveEncryptedState(
    result2.state,
    [encryptedState, encryptedState2],
    keys,
    keyPairsA.sign.publicKey
  );
  expect(result3.state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
        "lockboxPublicKey": "wevxDsZ-L7wpy3ePZcQNfG8WDh0wB0d27phr5OMdLwI",
        "name": "John Doe",
        "profileUpdatedBy": "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
      },
    }
  `);
});

test("should fail in case of two encryptedState clocks are identical", async () => {
  const key = createKey();
  const event = createChain(keyPairsA.sign, {
    [keyPairsA.sign.publicKey]: keyPairsA.box.publicKey,
  });
  const state = resolveState([event]);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairAPublicKey]: { name: "Jane Doe" } } },
    key,
    keyPairA
  );
  const encryptedState2 = encryptState(
    state,
    { members: { [keyPairAPublicKey]: { name: "John Doe" } } },
    key,
    keyPairA
  );

  const keys = { [key.keyId]: key.key };
  const resolve = () =>
    resolveEncryptedState(
      state,
      [encryptedState2, encryptedState],
      keys,
      keyPairsA.sign.publicKey
    );

  expect(resolve).toThrow(InvalidEncryptedStateError);
  expect(resolve).toThrow(
    "Identical clock values dedected for encrypted states."
  );
});

test("should order events by encryptedStateClock", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };
  const event = createChain(keyPairsA.sign, {
    [keyPairsA.sign.publicKey]: keyPairsA.box.publicKey,
  });
  const state = resolveState([event]);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairAPublicKey]: { name: "Jane Doe" } } },
    key,
    keyPairA
  );
  const result2 = resolveEncryptedState(
    state,
    [encryptedState],
    keys,
    keyPairsA.sign.publicKey
  );
  const encryptedState2 = encryptState(
    result2.state,
    { members: { [keyPairAPublicKey]: { name: "John Doe" } } },
    key,
    keyPairA
  );

  const result3 = resolveEncryptedState(
    result2.state,
    [encryptedState2, encryptedState],
    keys,
    keyPairsA.sign.publicKey
  );
  expect(result3.state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
        "lockboxPublicKey": "wevxDsZ-L7wpy3ePZcQNfG8WDh0wB0d27phr5OMdLwI",
        "name": "John Doe",
        "profileUpdatedBy": "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
      },
    }
  `);
});
