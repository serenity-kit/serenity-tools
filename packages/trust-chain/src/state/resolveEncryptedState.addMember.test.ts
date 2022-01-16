import sodium from "libsodium-wrappers";
import { addMember, createChain, resolveState, updateMember } from "..";
import {
  getKeyPairA,
  getKeyPairB,
  getKeyPairC,
  getKeyPairsA,
  getKeyPairsB,
  getKeyPairsC,
  KeyPairs,
} from "../testUtils";
import { hashTransaction } from "../utils";
import { createKey } from "./createKey";
import { encryptState } from "./encryptState";
import { resolveEncryptedState } from "./resolveEncryptedState";

let keyPairA: sodium.KeyPair = null;
let keyPairsA: KeyPairs = null;
let keyPairB: sodium.KeyPair = null;
let keyPairsB: KeyPairs = null;
let keyPairC: sodium.KeyPair = null;
let keyPairsC: KeyPairs = null;
let keyPairAPublicKey: string = null;
let keyPairCPublicKey: string = null;

beforeAll(async () => {
  await sodium.ready;
  keyPairA = getKeyPairA();
  keyPairsA = getKeyPairsA();
  keyPairB = getKeyPairB();
  keyPairsB = getKeyPairsB();
  keyPairC = getKeyPairC();
  keyPairsC = getKeyPairsC();
  keyPairAPublicKey = sodium.to_base64(keyPairA.publicKey);
  keyPairCPublicKey = sodium.to_base64(keyPairC.publicKey);
});

test("should allow the client to add a member to set the name", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };

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
  const chain = [createEvent, addMemberEvent, addMemberEvent2];
  const state = resolveState(chain);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairCPublicKey]: { name: "Anna" } } },
    key,
    keyPairB
  );

  const result2 = resolveEncryptedState(state, [encryptedState], keys);

  expect(result2.state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
        "lockboxPublicKey": "wevxDsZ-L7wpy3ePZcQNfG8WDh0wB0d27phr5OMdLwI",
      },
      "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": false,
        "isAdmin": false,
        "lockboxPublicKey": "b_skeL8qudNQji-HuOldPNFDzYSBENNqmFMlawhtrHg",
      },
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "addedBy": Array [
          "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
        ],
        "canAddMembers": false,
        "canRemoveMembers": false,
        "isAdmin": false,
        "lockboxPublicKey": "0hUuO22MoTa8X65ZvpR9KcfUwF_B2aIvLORPjuaofBg",
        "name": "Anna",
        "profileUpdatedBy": "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
      },
    }
  `);
});

test("should allow an admin to update the name of a member added by someone else", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };

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
  const chain = [createEvent, addMemberEvent, addMemberEvent2];
  const state = resolveState(chain);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairCPublicKey]: { name: "Anna" } } },
    key,
    keyPairA
  );

  const result2 = resolveEncryptedState(state, [encryptedState], keys);

  expect(result2.state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
        "lockboxPublicKey": "wevxDsZ-L7wpy3ePZcQNfG8WDh0wB0d27phr5OMdLwI",
      },
      "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": false,
        "isAdmin": false,
        "lockboxPublicKey": "b_skeL8qudNQji-HuOldPNFDzYSBENNqmFMlawhtrHg",
      },
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "addedBy": Array [
          "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
        ],
        "canAddMembers": false,
        "canRemoveMembers": false,
        "isAdmin": false,
        "lockboxPublicKey": "0hUuO22MoTa8X65ZvpR9KcfUwF_B2aIvLORPjuaofBg",
        "name": "Anna",
        "profileUpdatedBy": "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
      },
    }
  `);
});

test("should allow an admin to overwrite the name of a member", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };

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
  const chain = [createEvent, addMemberEvent, addMemberEvent2];
  const state = resolveState(chain);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairCPublicKey]: { name: "Nik" } } },
    key,
    keyPairB
  );
  const result2 = resolveEncryptedState(state, [encryptedState], keys);

  const encryptedState2 = encryptState(
    result2.state,
    { members: { [keyPairCPublicKey]: { name: "Niko" } } },
    key,
    keyPairA
  );
  const result3 = resolveEncryptedState(
    state,
    [encryptedState, encryptedState2],
    keys
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
      },
      "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": false,
        "isAdmin": false,
        "lockboxPublicKey": "b_skeL8qudNQji-HuOldPNFDzYSBENNqmFMlawhtrHg",
      },
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "addedBy": Array [
          "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
        ],
        "canAddMembers": false,
        "canRemoveMembers": false,
        "isAdmin": false,
        "lockboxPublicKey": "0hUuO22MoTa8X65ZvpR9KcfUwF_B2aIvLORPjuaofBg",
        "name": "Niko",
        "profileUpdatedBy": "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
      },
    }
  `);
});

test("should not allow for a member to overwrite the name set by an admin", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };

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
  const chain = [createEvent, addMemberEvent, addMemberEvent2];
  const state = resolveState(chain);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairCPublicKey]: { name: "Nik" } } },
    key,
    keyPairA
  );
  const result2 = resolveEncryptedState(state, [encryptedState], keys);

  const encryptedState2 = encryptState(
    result2.state,
    { members: { [keyPairCPublicKey]: { name: "Niko" } } },
    key,
    keyPairB
  );
  const result3 = resolveEncryptedState(
    result2.state,
    [encryptedState, encryptedState2],
    keys
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
      },
      "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": false,
        "isAdmin": false,
        "lockboxPublicKey": "b_skeL8qudNQji-HuOldPNFDzYSBENNqmFMlawhtrHg",
      },
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "addedBy": Array [
          "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
        ],
        "canAddMembers": false,
        "canRemoveMembers": false,
        "isAdmin": false,
        "lockboxPublicKey": "0hUuO22MoTa8X65ZvpR9KcfUwF_B2aIvLORPjuaofBg",
        "name": "Nik",
        "profileUpdatedBy": "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
      },
    }
  `);
});

test("should not allow for a member to overwrite the name added by the member, but later promoted to admin", async () => {
  const key = createKey();
  const keys = { [key.keyId]: key.key };

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
  const updateMemberEvent = updateMember(
    hashTransaction(addMemberEvent2.transaction),
    keyPairA,
    keyPairsC.sign.publicKey,
    { isAdmin: true, canAddMembers: true, canRemoveMembers: true }
  );
  const chain = [
    createEvent,
    addMemberEvent,
    addMemberEvent2,
    updateMemberEvent,
  ];
  const state = resolveState(chain);
  const encryptedState = encryptState(
    state,
    { members: { [keyPairCPublicKey]: { name: "Jane Doe" } } },
    key,
    keyPairB
  );
  const result2 = resolveEncryptedState(state, [encryptedState], keys);

  expect(result2.state.members).toMatchInlineSnapshot(`
    Object {
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
        "lockboxPublicKey": "wevxDsZ-L7wpy3ePZcQNfG8WDh0wB0d27phr5OMdLwI",
      },
      "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY": Object {
        "addedBy": Array [
          "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM",
        ],
        "canAddMembers": true,
        "canRemoveMembers": false,
        "isAdmin": false,
        "lockboxPublicKey": "b_skeL8qudNQji-HuOldPNFDzYSBENNqmFMlawhtrHg",
      },
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk": Object {
        "addedBy": Array [
          "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY",
        ],
        "canAddMembers": true,
        "canRemoveMembers": true,
        "isAdmin": true,
        "lockboxPublicKey": "0hUuO22MoTa8X65ZvpR9KcfUwF_B2aIvLORPjuaofBg",
      },
    }
  `);
});
