/*
  This script shows how to create a multisig transaction in parallel. All
  players sign their copy of the transaction and pass their signatures to
  an aggregator. The aggregator combines all signatures into a final transaction
  and broadcasts it.

  1. Bob signs his copy of the transaction and sends his signature to Sam.
  2. Alice signers her copy of the transaction and send her signature to Sam.
  3. Sam signs his copy of the transaciton, adds the signatures he's recieved,
     and broadcasts the final transaction.
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
    const requiredSignatures = 3;

    // Multisig info from 01-create-ms-wallet.js:
    const msInfo = {
      address: "bitcoincash:pq0ra2wgamhupx22s93wk2lxsv6khtus0shqt604an",
      scriptHex: "a9141e3ea9c8eeefc0994a8162eb2be683356baf907c87",
      publicKeys: [
        "03caf75eb8c8262eaf072ba37078e741f2e4e961b12f8548e4a39939bd10af0568",
        "0399bcaf2785078b4992fac6e8336bdd651af0896a13874fe2db8ffe739ec5b116",
        "03282aa7d7d55a8a9fcd32dcf302e55432d8d595c1423cff7a90aacb227aa2bcd4",
        "0380cb3a3b10bb75c3bde6b51011fd49ccc406fb4d597ed25385475deac14c3e01",
        "030ef63f40b6ea4596393ccc2ba6868699cdb48ec52d2ffd5340df2abfede5440e"
      ],
      requiredSignatures: 3
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
      .from(utxo, msInfo.publicKeys, msInfo.requiredSignatures)
      // Spend dust to a target address.
      .to("bitcoincash:qr6felm82hvuxu7asu7x4kvmnnpx406cgq4pzzqd0r", 546)
      .feePerByte(1)
      // Send change back to the multisig address
      .change(msInfo.address);

    // This unsigned transaction object is sent to all participants.
    const unsignedTxObj = multisigTx.toObject();

    // Bob

    // Bob converts the object into a Transaction class.
    const bobsTx = new bitcore.Transaction(unsignedTxObj)

    // Sign the transaction with Bob's key.
    const bobsPartiallySignedTx = bobsTx.sign(
      new bitcore.PrivateKey(bobPrivKey)
    );

    // Get Bob's signature from the transaction
    let bobsSig = bobsPartiallySignedTx.getSignatures(bobPrivKey)

    // Convert Bob's signature into an object and pass it to Sam.
    bobsSig = bobsSig[0].toObject()

    // Alice

    // Alice recieves the transaction Object and converts it into a Bitcore Transaction.
    const aliceTx = new bitcore.Transaction(unsignedTxObj);
    // console.log('aliceTx: ', aliceTx)

    // Alice signs her input to the transaction.
    const alicesPartiallySignedTx = aliceTx.sign(new bitcore.PrivateKey(alicePrivKey));

    // Get Alice's signature from the transaction.
    let aliceSig = alicesPartiallySignedTx.getSignatures(alicePrivKey)

    // Convert Alices's signature into an object and passes it to Sam.
    aliceSig = aliceSig[0].toObject()

    // Sam

    // Sam receives the transaction Object and converts it into a Bitcore Transaction.
    const samTx = new bitcore.Transaction(unsignedTxObj);

    // Sam signs the transaction.
    const samPartiallySignedTx = samTx.sign(new bitcore.PrivateKey(samPrivKey));
    // console.log('samPartiallySignedTx.inputs[0].signatures: ', samPartiallySignedTx.inputs[0].signatures)

    // Sam converts Bob's signature object into an instance of the Signature class.
    const bobsSig2 = new bitcore.Transaction.Signature.fromObject(bobsSig)
    // console.log('bobsSig2: ', bobsSig2)

    // Sam adds Bob's signature to the transaction.
    samPartiallySignedTx.applySignature(bobsSig2)

    // Save converts Alice's sigature object into an instance of the Signature class.
    const aliceSig2 = new bitcore.Transaction.Signature.fromObject(aliceSig)

    // Sam adds Alice's signature to the transaction.
    samPartiallySignedTx.applySignature(aliceSig2)

    // Convert the 2-of-3 signed transaction into hex format.
    const txHex = samPartiallySignedTx.toString();
    // console.log("\ntx hex: ", txHex);

    // Sam Broadcast's the transaction to the network.
    // Note: Now that the TX is fully signed, it can be sent to anyone and broadcast by anyone.
    const txid = await bchjs.RawTransactions.sendRawTransaction(txHex);
    console.log(`\ntxid: ${txid}`);
    console.log(`https://blockchair.com/bitcoin-cash/transaction/${txid}`);

    // Note: Sam is not involved, since this is a 2-of-3.
  } catch (err) {
    console.error(err);
  }
}
runTest();
