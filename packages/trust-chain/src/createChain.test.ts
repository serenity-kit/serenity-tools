import sodium from "libsodium-wrappers";
import { createChain } from "./index";
import { getKeyPairA } from "./testUtils";
import { isValidCreateChainEvent } from "./utils";

let keyPairA: sodium.KeyPair = null;

beforeAll(async () => {
  await sodium.ready;
  keyPairA = getKeyPairA();
});

test("should create a new chain event", async () => {
  const event = createChain(keyPairA, [sodium.to_base64(keyPairA.publicKey)]);
  expect(event.prevHash).toBeNull();
  expect(isValidCreateChainEvent(event)).toBe(true);
});
