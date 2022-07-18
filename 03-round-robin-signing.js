/*
  This script is nearly identical to 02 if effect, except that simulates
  round-robin signing by each of the participants. This is the type of signing
  in the real world.

  1. Bob creates a multisig spending transaction and signs it.
  2. Bob converts the partially signed tx into an Object and passes it to Alice.
  3. Alice reconstructs the tx from the Object and signs her input.
  4. Alice broadcasts the transaction.

  Note: Sam is not involved because this is a 2-of-3 multisig.
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

    // Multisig info from 01-create-ms-wallet.js:
    const msInfo = {
      address: "bitcoincash:pqvey56hu0ewkv8jedyxvyamw3lq6pwq5qxjfvj08h",
      scriptHex: "a91419925357e3f2eb30f2cb486613bb747e0d05c0a087",
      publicKeys: [
        "03caf75eb8c8262eaf072ba37078e741f2e4e961b12f8548e4a39939bd10af0568",
        "0399bcaf2785078b4992fac6e8336bdd651af0896a13874fe2db8ffe739ec5b116",
        "03282aa7d7d55a8a9fcd32dcf302e55432d8d595c1423cff7a90aacb227aa2bcd4"
      ],
      requiredSignatures: 2
    };

    // Get UTXO information for the multisig address.
    const utxos = await bchjs.Utxo.get(msInfo.address);
    // Grab the biggest BCH UTXO for spending.
    const utxoToSpend = bchjs.Utxo.findBiggestUtxo(utxos.bchUtxos);

    // Repackage the UTXO for bitcore-lib-cash
    const utxo = {
      txid: utxoToSpend.tx_hash,
      outputIndex: utxoToSpend.tx_pos,
      address: msInfo.address,
      script: msInfo.scriptHex,
      satoshis: utxoToSpend.value
    };

    // Generate a multisignature transaction.
    const multisigTx = new bitcore.Transaction()
      .from(utxo, publicKeys, requiredSignatures)
      // Spend dust to a target address.
      .to("bitcoincash:qr6felm82hvuxu7asu7x4kvmnnpx406cgq4pzzqd0r", 546)
      .feePerByte(1)
      // Send change back to the multisig address
      .change(msInfo.address)

    // Sign the transaction with Bob's key.
    const partiallySignedTx = multisigTx.sign(new bitcore.PrivateKey(bobPrivKey))

    // Convert the transaction to an Object, in preparation of sending it to Alice.
    const partiallySignedTxObj = partiallySignedTx.toObject()
    // console.log(`partiallySignedTxObj: ${JSON.stringify(partiallySignedTxObj)}`)

    // Alice recieves the transaction Object and converts it into a Bitcore Transaction.
    const aliceTx = new bitcore.Transaction(partiallySignedTxObj)
    // console.log('aliceTx: ', aliceTx)

    // Alice signs her input to the transaction.
    const fullySignedTx = aliceTx.sign(new bitcore.PrivateKey(alicePrivKey))

    // Convert the 2-of-3 signed transaction into hex format.
    const txHex = fullySignedTx.toString();
    // console.log("\ntx hex: ", txHex);

    // Alice Broadcast's the transaction to the network.
    const txid = await bchjs.RawTransactions.sendRawTransaction(txHex);
    console.log(`\ntxid: ${txid}`);
    console.log(`https://blockchair.com/bitcoin-cash/transaction/${txid}`);

    // Note: Sam is not involved, since this is a 2-of-3.

  } catch (err) {
    console.error(err);
  }
}
runTest();
