async function maker(){
  var id1 = parseInt(document.getElementById("id1").value);
  var id2 = parseInt(document.getElementById("id2").value);
  var side = parseInt(document.getElementById("side").value);
  var odds = parseFloat(document.getElementById("odds").value);
  var stake = parseFloat(document.getElementById("stake").value);

  var home, home256, home1s, away, away256, away1s;
  if(side == 0){
    home = stake * 100;
    away = stake * (odds - 1) * 100;
  }
  else {
    away = stake * 100;
    home = stake * (odds - 1) * 100;
  }
  home256 = Math.floor(home / 256);
  home1s = Math.floor(home % 256);
  away256 = Math.floor(away / 256);
  away1s = Math.floor(away % 256);
  
  var transaction = new solanaWeb3.Transaction();
  
  var rentExemptVal = await connection.getMinimumBalanceForRentExemption(71);
  var seed = 'a' + Math.random() * 1000000000000;
  var newAcc = await solanaWeb3.PublicKey.createWithSeed(globalKey, seed, programID);
  var newAccData = await connection.getAccountInfo(newAcc);
  var counter = 0;
  while (newAccData != null) {
    newAcc = await solanaWeb3.PublicKey.createWithSeed(globalKey, seed + counter, programID);
    newAccData = await connection.getAccountInfo(newAcc);
    counter += 1;
  }

  var instr = solanaWeb3.SystemProgram.createAccountWithSeed({
    fromPubkey: globalKey,
    basePubkey: globalKey,
    seed: seed,
    newAccountPubkey: newAcc,
    lamports: rentExemptVal,
    space: 71,
    programId: programID,
  });

  transaction.add(instr);

  var callForATA = await connection.getTokenAccountsByOwner(globalKey, { mint: mint });
  var bettorAssocTokAddr = callForATA.value[0].pubkey;

  var currInstr = new solanaWeb3.TransactionInstruction({
    keys: [
      { pubkey: newAcc, isSigner: false, isWritable: true },
      {pubkey: tokenProgram, isSigner: false, isWritable: false},
      { pubkey: bettorAssocTokAddr, isSigner: false, isWritable: true },
      {pubkey: mint, isSigner: false, isWritable: true},
      {pubkey: bankAssocTok, isSigner: false, isWritable: true},
      { pubkey: globalKey, isSigner: false, isWritable: true },
    ],
    programId: programID,
    data: new Uint8Array([side, id1, id2, home256, home1s, away256, away1s]),
  });
  transaction.add(currInstr);

  transaction.feePayer = globalKey;
  var blockhashObj = await connection.getRecentBlockhash();
	transaction.recentBlockhash = await blockhashObj.blockhash; 
  var signed = await globalProvider.signTransaction(transaction);
  var signature = await connection.sendRawTransaction(signed.serialize());
	await connection.confirmTransaction(signature);
  document.getElementById("sig").innerHTML = signature;
  document.getElementById("addr").innerHTML = newAcc.toBase58();
}