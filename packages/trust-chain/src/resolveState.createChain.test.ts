import sodium from "libsodium-wrappers";
import { addAuthorToEvent } from "./addAuthorToEvent";
import { InvalidTrustChainError } from "./errors";
import { createChain, resolveState } from "./index";
import { getKeyPairA, getKeyPairB, getKeyPairC } from "./testUtils";

let keyPairA: sodium.KeyPair = null;
let keyPairB: sodium.KeyPair = null;
let keyPairC: sodium.KeyPair = null;

beforeAll(async () => {
  await sodium.ready;
  keyPairA = getKeyPairA();
  keyPairB = getKeyPairB();
  keyPairC = getKeyPairC();

  // const newKeyPair = sodium.crypto_sign_keypair();
  // console.log("privateKey: ", sodium.to_base64(newKeyPair.privateKey));
  // console.log("publicKey: ", sodium.to_base64(newKeyPair.publicKey));
});

test("should resolve to one admin after creating a chain", async () => {
  const event = createChain(keyPairA, [sodium.to_base64(keyPairA.publicKey)]);
  const state = resolveState([event]);
  expect(state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
    }
  `);
});

test("should resolve to two admins after creating a chain with two authors", async () => {
  const event = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
    sodium.to_base64(keyPairB.publicKey),
  ]);
  const event2 = addAuthorToEvent(event, keyPairB);
  const state = resolveState([event2]);
  expect(state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
      "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY": Object {
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
      },
    }
  `);
});

test("should fail in case there are more authors than declared admins", async () => {
  const event = createChain(keyPairA, [sodium.to_base64(keyPairA.publicKey)]);
  const event2 = addAuthorToEvent(event, keyPairB);
  const chain = [event2];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Invalid chain creation event.");
});

test("should fail in case the authors and declared admins don't match up", async () => {
  const event = createChain(keyPairA, [
    sodium.to_base64(keyPairA.publicKey),
    sodium.to_base64(keyPairC.publicKey),
  ]);
  const event2 = addAuthorToEvent(event, keyPairB);
  const chain = [event2];
  expect(() => resolveState(chain)).toThrow(InvalidTrustChainError);
  expect(() => resolveState(chain)).toThrow("Invalid chain creation event.");
});
