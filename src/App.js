import React from "react";

const mystore = window.SignalProtocolStore;
const storage = new mystore();
const KeyHelper = window.libsignal.KeyHelper;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.generatePreKeyBundle = this.generatePreKeyBundle.bind(this);
  }

  generateIdentity(store) {
    return Promise.all([
      KeyHelper.generateIdentityKeyPair(),
      KeyHelper.generateRegistrationId(),
    ]).then(function (result) {
      store.put("identityKey", result[0]);
      store.put("registrationId", result[1]);
      console.log("result", result);
    });
  }

  generatePreKeyBundle(store, preKeyId, signedPreKeyId) {
    return Promise.all([
      store.getIdentityKeyPair(),
      store.getLocalRegistrationId(),
    ]).then(function (result) {
      var identity = result[0];
      var registrationId = result[1];
      console.log("identity", identity);
      console.log("regid", registrationId);
      return Promise.all([
        KeyHelper.generatePreKey(preKeyId),
        KeyHelper.generateSignedPreKey(identity, signedPreKeyId),
      ]).then(function (keys) {
        var preKey = keys[0];
        var signedPreKey = keys[1];

        store.storePreKey(preKeyId, preKey.keyPair);
        store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

        return {
          identityKey: identity.pubKey,
          registrationId: registrationId,
          preKey: {
            keyId: preKeyId,
            publicKey: preKey.keyPair.pubKey,
          },
          signedPreKey: {
            keyId: signedPreKeyId,
            publicKey: signedPreKey.keyPair.pubKey,
            signature: signedPreKey.signature,
          },
        };
      });
    });
  }
  getRecord = (encodedNumber) => {
    console.log(encodedNumber);
    return storage.loadSession(encodedNumber).then(function (serialized) {
      if (serialized === undefined) {
        return undefined;
      }
      //  return Internal.SessionRecord.deserialize(serialized);
    });
  };
  encryptMsg = async () => {
    var ALICE_ADDRESS = new window.libsignal.SignalProtocolAddress(
      "xxxxxxxxx",
      0
    );
    this.getRecord(ALICE_ADDRESS);
    var BOB_ADDRESS = new window.libsignal.SignalProtocolAddress(
      "yyyyyyyyyyyyy",
      0
    );
    this.getRecord(BOB_ADDRESS);

    var aliceStore = new window.SignalProtocolStore();

    var bobStore = new window.SignalProtocolStore();
    var bobPreKeyId = 1337;
    var bobSignedKeyId = 1;

    var Curve = window.libsignal.Curve;

    Promise.all([
      this.generateIdentity(aliceStore),
      this.generateIdentity(bobStore),
      this.getRecord(BOB_ADDRESS),
    ])
      .then(() => {
        return this.generatePreKeyBundle(bobStore, bobPreKeyId, bobSignedKeyId);
      })
      .then((preKeyBundle) => {
        var builder = new window.libsignal.SessionBuilder(
          aliceStore,
          BOB_ADDRESS
        );
        this.getRecord(BOB_ADDRESS);
        return builder.processPreKey(preKeyBundle).then(function () {
          var originalMessage = window.util.toArrayBuffer("my message ......");
          // var originalMessage = util.toArrayBuffer(
          //   "my message ......"
          // );
          var aliceSessionCipher = new window.libsignal.SessionCipher(
            aliceStore,
            BOB_ADDRESS
          );
          var bobSessionCipher = new window.libsignal.SessionCipher(
            bobStore,
            ALICE_ADDRESS
          );

          aliceSessionCipher
            .encrypt(originalMessage)
            .then(function (ciphertext) {
              // check for ciphertext.type to be 3 which includes the PREKEY_BUNDLE
              return bobSessionCipher.decryptPreKeyWhisperMessage(
                ciphertext.body,
                "binary"
              );
            })
            .then(function (plaintext) {
              // alert(plaintext);

              console.log(plaintext);
            });

          bobSessionCipher
            .encrypt(originalMessage)
            .then(function (ciphertext) {
              console.log(ciphertext);
              return aliceSessionCipher.decryptWhisperMessage(
                ciphertext.body,
                "binary"
              );
            })
            .then(function (plaintext) {
              console.log("checkkkkkkkkkkkkkkkkkkkkk");
              // assesrtEqualArrayBuffers(plaintext, 'originalMessage');
            });
        });
      });
  };

  async componentDidMount() {
    console.log(window.crypto.getRandomValues(new Int8Array(3)));
    console.log(window.helpers);
    // this.generateIdentityKey();
    this.encryptMsg();

    // var KeyHelper = window.libsignal.KeyHelper;
    // const mystore = window.SignalProtocolStore;
    // var store = new mystore();
    // var KeyHelper = window.libsignal.KeyHelper;

    // KeyHelper.generateIdentityKeyPair().then(function (identityKeyPair) {
    //     store.put("identityKey", identityKeyPair);
    // })
    // this.generatePreKeyBundle()

    // // console.log(sto)
    // var registrationId = KeyHelper.generateRegistrationId();

    // const keyId = 1001;
    // // Store registrationId somewhere durable and safe.
    // console.log(registrationId);
    // KeyHelper.generateIdentityKeyPair().then(function (identityKeyPair) {
    //   store.put("identityKey", identityKeyPair);

    //   console.log(identityKeyPair);
    //   KeyHelper.generatePreKey(keyId).then(function (preKey) {
    //     const storage = store.getIdentityKeyPair();
    //     console.log("store", storage);
    //     store.storePreKey(preKey.keyId, preKey.keyPair);

    //     KeyHelper.generateSignedPreKey(identityKeyPair, keyId).then(function (
    //       signedPreKey
    //     ) {
    //       store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
    //       console.log("sign", signedPreKey.keyPair.pubKey);
    //       var address = new window.libsignal.SignalProtocolAddress('anto', 0);

    //       // Instantiate a SessionBuilder for a remote recipientId + deviceId tuple.
    //       var sessionBuilder = new window.libsignal.SessionBuilder(
    //         store,
    //         address
    //       );
    //       var promise = sessionBuilder.processPreKey({
    //         registrationId: registrationId,
    //         identityKey: identityKeyPair.pubKey,
    //         signedPreKey: {
    //           keyId: signedPreKey.keyId,
    //           publicKey: signedPreKey.keyPair.pubKey,
    //           signature: signedPreKey.signature,
    //         },
    //         preKey: {
    //           keyId: preKey.keyId,
    //           publicKey: preKey.keyPair.pubKey,
    //         },
    //       });
    //       promise.then(function onsuccess(x) {
    //         // encrypt messages
    //         console.log(x)
    //         var address = new window.libsignal.SignalProtocolAddress("anto", 0);
    //         const mystore = window.SignalProtocolStore;
    //         var store = new mystore();
    //         var plaintext = "Hello world";
    //         var sessionCipher = new window.libsignal.SessionCipher(
    //           store,
    //           address
    //         );
    //         sessionCipher.encrypt(plaintext).then(function (ciphertext) {
    //           // ciphertext -> { type: <Number>, body: <string> }
    //           console.log(ciphertext);
    //           // handle(ciphertext.type, ciphertext.body);
    //         });
    //       });

    //       promise.catch(function onerror(error) {
    //         // handle identity key conflict
    //         console.log(error);
    //       });
    //       console.log("promise", promise);
    //     });
    //   });
    // });
  }

  render() {
    return (
      <div className="App">
        <h1>hello</h1>
      </div>
    );
  }
}
