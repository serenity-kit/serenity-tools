import sodium from "libsodium-wrappers";
import { getKeyPairA } from "../testUtils";
import { verifyAndApplyEncryptedState } from "./verifyAndApplyEncryptedState";
import { createKey } from "./createKey";
import { encryptState } from "./encryptState";
import { createChain, resolveState } from "..";

let keyPairA: sodium.KeyPair = null;
let keyPairAPublicKey: string = null;

beforeAll(async () => {
  await sodium.ready;
  keyPairA = getKeyPairA();
  keyPairAPublicKey = sodium.to_base64(keyPairA.publicKey);
});

test("should add name to member", async () => {
  const key = createKey();
  const event = createChain(keyPairA, [sodium.to_base64(keyPairA.publicKey)]);
  const state = resolveState([event]);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairAPublicKey]: { name: "Jane Doe" } } },
    key,
    keyPairA
  );
  const { state: newState } = verifyAndApplyEncryptedState(
    state,
    encryptedState,
    key.key
  );
  expect(newState.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
        "name": "Jane Doe",
        "profileUpdatedBy": "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
      },
    }
  `);
});
