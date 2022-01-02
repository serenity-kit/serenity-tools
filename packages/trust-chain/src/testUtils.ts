import sodium from "libsodium-wrappers";

export const getKeyPairA = (): sodium.KeyPair => {
  return {
    privateKey: sodium.from_base64(
      "g3dtwb9XzhSzZGkxTfg11t1KEIb4D8rO7K54R6dnxArvgg_OzZ2GgREtG7F5LvNp3MS8p9vsio4r6Mq7SZDEgw"
    ),
    publicKey: sodium.from_base64(
      "74IPzs2dhoERLRuxeS7zadzEvKfb7IqOK-jKu0mQxIM"
    ),
    keyType: "ed25519",
  };
};

export const getKeyPairB = (): sodium.KeyPair => {
  return {
    privateKey: sodium.from_base64(
      "JyI15wGDAmduTUfhmzkIYePqFdPaEG3QLUdRrkqC1dAxMOGpUgx-VMPQJqv4pI_UxYIgRiqzYsFpd9TbR2LS1g"
    ),
    publicKey: sodium.from_base64(
      "MTDhqVIMflTD0Car-KSP1MWCIEYqs2LBaXfU20di0tY"
    ),
    keyType: "ed25519",
  };
};

export const getKeyPairC = (): sodium.KeyPair => {
  return {
    privateKey: sodium.from_base64(
      "W4EYSNTXQqkbv6_P1MF6T7gqRD6J7UyZikDxH9kwTOpkpzCMAwBpKKruTcxBVBRnppruQGt4r__mGQYjhIKW2Q"
    ),
    publicKey: sodium.from_base64(
      "ZKcwjAMAaSiq7k3MQVQUZ6aa7kBreK__5hkGI4SCltk"
    ),
    keyType: "ed25519",
  };
};
