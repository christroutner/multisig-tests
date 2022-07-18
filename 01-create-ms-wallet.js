/*
  This file generates a 2-of-3 multisig wallet.

  The output is an object that will be needed when spending from the multisig wallet.
*/

// Global npm libraries
const BCHJS = require("@psf/bch-js");
const bitcore = require("bitcore-lib-cash");

const bchjs = new BCHJS();

// bitcoincash:qpndhz5fvr3ew77pafc6qlspz8pn69zttqtzgtr7a7
const bobMnemonic =
  "place sun cliff chunk nominee wonder aunt vibrant history drastic brisk mule";

// bitcoincash:qzyt8d25has2fftr6dukc6y7y7wuus9fvgrs03ufne
const aliceMnemonic =
  "type escape source cover matrix angle review glass wisdom minimum saddle photo";

// bitcoincash:qrq7y0qeyrufug2p3vtm7wzpl3q9hzs3ls2kqd6vfd
const samMnemonic =
  "action other idle wire swarm myself dwarf catalog ensure economy assault name";

async function runTest() {
  try {
    // Create public key for Alice
    const aliceSeed = await bchjs.Mnemonic.toSeed(aliceMnemonic);
    const aliceHDNode = bchjs.HDNode.fromSeed(aliceSeed);
    const aliceNode = bchjs.HDNode.derivePath(aliceHDNode, "m/44'/145'/0'/0/0");
    const alicePrivKey = bchjs.HDNode.toWIF(aliceNode);
    const alicePubKey = new bitcore.PrivateKey(alicePrivKey).toPublicKey();

    // Create public key for Bob
    const bobSeed = await bchjs.Mnemonic.toSeed(bobMnemonic);
    const bobHDNode = bchjs.HDNode.fromSeed(bobSeed);
    const bobNode = bchjs.HDNode.derivePath(bobHDNode, "m/44'/145'/0'/0/0");
    const bobPrivKey = bchjs.HDNode.toWIF(bobNode);
    const bobPubKey = new bitcore.PrivateKey(bobPrivKey).toPublicKey();

    // Create public key for Sam
    const samSeed = await bchjs.Mnemonic.toSeed(samMnemonic);
    const samHDNode = bchjs.HDNode.fromSeed(samSeed);
    const samNode = bchjs.HDNode.derivePath(samHDNode, "m/44'/145'/0'/0/0");
    const samPrivKey = bchjs.HDNode.toWIF(samNode);
    const samPubKey = new bitcore.PrivateKey(samPrivKey).toPublicKey();

    const publicKeys = [alicePubKey, bobPubKey, samPubKey];
    const requiredSignatures = 2;

    // Generate a P2SH multisig address.
    const address = new bitcore.Address(publicKeys, requiredSignatures);
    // console.log(`P2SH multisig address: ${address}`)

    strPublicKeys = publicKeys.map(x => x.toString());

    const scriptHex = new bitcore.Script(address).toHex();
    // console.log(`address Script serialized: ${scriptHex}`)

    const msInfo = {
      address: address.toString(),
      scriptHex,
      publicKeys: strPublicKeys,
      requiredSignatures
    };

    console.log(
      `To spend from the multisig address, the app will need this information:\n${JSON.stringify(
        msInfo,
        null,
        2
      )}`
    );
  } catch (err) {
    console.error(err);
  }
}
runTest();
