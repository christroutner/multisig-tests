/*
  This is the same as 02-spend-ms-wallet.js, but it generates a 3-of-5 multisig
  wallet, which is more in-line with real-world use.
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

// bitcoincash:qqjrxfqpggjypuqt5y3w9zt94mxmluqarg4nc9slt4
// L1tYRdpRPGANA3CQu4qDF7sgZrxgoSeFM83TxXYFczUP1Muipmss
const player4Mnemonic = 'lunar turtle such credit rotate glow balcony timber fantasy opera cushion top'

// bitcoincash:qzj72ymjnuekyjsd9f5s9gfj3p9d7gznyqssms0swm
// KyujKRzKohRC48tzV5fXMrBCQWZ7GT2bgjFAnNVAncUkb8VGfNY2
const player5Mnemonic = 'syrup insect defy boat cabin execute guilt long absent allow head coral'

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

    // Create public key for player4
    const player4Seed = await bchjs.Mnemonic.toSeed(player4Mnemonic);
    const player4HDNode = bchjs.HDNode.fromSeed(player4Seed);
    const player4Node = bchjs.HDNode.derivePath(player4HDNode, "m/44'/145'/0'/0/0");
    const player4PrivKey = bchjs.HDNode.toWIF(player4Node);
    const player4PubKey = new bitcore.PrivateKey(player4PrivKey).toPublicKey();

    // Create public key for player5
    const player5Seed = await bchjs.Mnemonic.toSeed(player5Mnemonic);
    const player5HDNode = bchjs.HDNode.fromSeed(player5Seed);
    const player5Node = bchjs.HDNode.derivePath(player5HDNode, "m/44'/145'/0'/0/0");
    const player5PrivKey = bchjs.HDNode.toWIF(player5Node);
    const player5PubKey = new bitcore.PrivateKey(player5PrivKey).toPublicKey();

    const publicKeys = [alicePubKey, bobPubKey, samPubKey, player4PubKey, player5PubKey];
    const requiredSignatures = 3;

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
