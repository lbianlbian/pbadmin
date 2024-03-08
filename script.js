var programID = new solanaWeb3.PublicKey("39mBcnQ27QA9nNZmM6VrumE2vtqs5v3HD7t7RGv9kXUV");
var connection = new solanaWeb3.Connection("https://spring-frosty-snowflake.solana-mainnet.discover.quiknode.pro/5584f3ace79637af8f83a6f135554af9e0f0ffca/", "confirmed");

var bankpda = new solanaWeb3.PublicKey("CSxoXkPJTw2WsnNDHZ3mBnQ12TsREHZ7Xv66hbNtpPX9");

var bankAssocTok = new solanaWeb3.PublicKey("BFUSPxUMEDZWh4YUHSJeHCa5uzYTxX4AAg5ESxnuFT4B");
var tokenProgram = new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
var mint = new solanaWeb3.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

var globalProvider;
var globalKey;

var all0s = "need to fix this ";

function phantom_connect() {
  var provider = () => {
    if ("solana" in window) {
      var provider = window.solana;
	    globalProvider = provider;
      if (provider.isPhantom) {
        return provider;
      } else {
        return false;
      }
    }
    window.open("https://phantom.app", "_blank");
  };
  var phantom = provider();
  if (phantom !== false) {
    try {
      var connect_wallet = phantom.connect();
      phantom.on("connect", async () => {
	      globalKey = phantom.publicKey;

        document.getElementById("display").innerHTML = globalKey.toString();
	
     });
     } catch (err) {
        console.log("Connection Cancelled!");
    }
  }
}

async function getBets(id1, id2){ 
  
  var b58id = base58.encode([id1, id2]);
  var accs = await connection.getProgramAccounts
    (programID, 
      {filters:
       [
        {memcmp: {offset: 0, bytes: b58id} }, 
       ],
       //dataSlice: {length: 65, offset: 6}
      }
    );
  if(accs.length == 0){
    alert("Either there are no bets on this market or the RPC ran into an error.");
  }
  return accs;
}

async function getBumpKey(){
  var bumpKeyArr = await solanaWeb3.PublicKey.findProgramAddress([ new Uint8Array([98, 97, 110, 107])], programID);
  var bumpKey = bumpKeyArr[1];
  return bumpKey;
}

async function grade(){
  var id1 = document.getElementById("id1").value;
  var id2 = document.getElementById("id2").value;
  var winner = document.getElementById("winner").value;
  await gradeParams(id1, id2, winner);
}

async function gradeParams(id1, id2, winner){
  if(winner == "99"){
    await wagerPushParams(id1, id2);
    return;
  }
  document.getElementById("txsizemsg").innerHTML = "";
  var accs = await getBets(id1, id2);
  var bumpKey = await getBumpKey();   

  //var adminAssocTokArr = await connection.getTokenAccountsByOwner(globalKey, {mint: mint});
  //var adminAssocTok = adminAssocTokArr.value[0].pubkey;
  var transaction = new solanaWeb3.Transaction();
  transaction.feePayer = globalKey;
	var blockhashObj = await connection.getRecentBlockhash();
	transaction.recentBlockhash = await blockhashObj.blockhash; 
  var x = 0;
  
  while(transaction.serialize({requireAllSignatures: false, verifySignatures: false}).length < 1100 && x < accs.length){
    var betAcc = accs[x].pubkey;
    var receiver;
    
    var homeWallet = new solanaWeb3.PublicKey(accs[x].account.data.slice(6, 38));
    var awayWallet = new solanaWeb3.PublicKey(accs[x].account.data.slice(38, 70));

    if (homeWallet.toBase58() == all0s || awayWallet.toBase58() == all0s){
      x += 1;
      continue;
    }
    else if (winner == "0"){
      receiver = homeWallet;
    }
    else if(winner == "1"){
      receiver = awayWallet;
    }
    
    var receiverAssocTok = await connection.getTokenAccountsByOwner(receiver, {mint: mint});

    var rentExemptionPayer;
    if(accs[x].account.data[70] == 0){
      rentExemptionPayer = new solanaWeb3.PublicKey(accs[x].account.data.slice(6, 38));
    }
    else if(accs[x].account.data[70] == 1){
      rentExemptionPayer = new solanaWeb3.PublicKey(accs[x].account.data.slice(38, 70));
    }
    
    var instruction  = new solanaWeb3.TransactionInstruction({
		  keys: [
        {pubkey: betAcc, isSigner: false, isWritable: true},
        {pubkey: tokenProgram, isSigner: false, isWritable: false},
        {pubkey: bankAssocTok, isSigner: false, isWritable: true},
        {pubkey: mint, isSigner: false, isWritable: true},
        {pubkey: receiverAssocTok.value[0].pubkey, isSigner: false, isWritable: true},
        {pubkey: receiver, isSigner: false, isWritable: true},
        {pubkey: bankpda, isSigner: false, isWritable: true},
        {pubkey: globalKey, isSigner: true, isWritable: true},
        {pubkey: rentExemptionPayer, isSigner: false, isWritable: true},
      ],
  		programId: programID,
	  	data: new Uint8Array([bumpKey, parseInt(id1), parseInt(id2), parseInt(winner)]),
	  });
    transaction.add(instruction); 
    x += 1;
    console.log(transaction.serialize({requireAllSignatures: false, verifySignatures: false}).length);
  }
  
  document.getElementById("txsizemsg").innerHTML = "There were " + (accs.length - x) + " accounts left ungraded because of transaction size";
  
	signed = await globalProvider.signTransaction(transaction);
  signature = await connection.sendRawTransaction(signed.serialize());
	await connection.confirmTransaction(signature);
  console.log(signature);
  document.getElementById("gradeSig").innerHTML = signature;
  document.getElementById("gradeSig").setAttribute("href", "https://explorer.solana.com/tx/" + signature);
}

async function wagerPush(){
  var id1 = document.getElementById("id1").value;
  var id2 = document.getElementById("id2").value;
  await wagerPushParams(id1, id2);
}

async function wagerPushParams(id1, id2){
  
  var accs = await getBets(id1, id2);
  var bumpKey = await getBumpKey();
  var transaction = new solanaWeb3.Transaction();
  transaction.feePayer = globalKey;
	var blockhashObj = await connection.getRecentBlockhash();
	transaction.recentBlockhash = await blockhashObj.blockhash;
  var x = 0;
  
  while(transaction.serialize({requireAllSignatures: false, verifySignatures: false}).length < 1075 && x < accs.length){
    var betAcc = accs[x].pubkey;
    var homeWallet = new solanaWeb3.PublicKey(accs[x].account.data.slice(6, 38));
    var awayWallet = new solanaWeb3.PublicKey(accs[x].account.data.slice(38, 70));

    if (homeWallet.toBase58() == all0s || awayWallet.toBase58() == all0s){
      x += 1;
      continue;
    }

    var homeAssocTok = await connection.getTokenAccountsByOwner(homeWallet, {mint: mint});
    var awayAssocTok = await connection.getTokenAccountsByOwner(awayWallet, {mint: mint});

    var instruction = new solanaWeb3.TransactionInstruction({
		  keys: [
        {pubkey: betAcc, isSigner: false, isWritable: true},
        {pubkey: tokenProgram, isSigner: false, isWritable: false},
        {pubkey: bankAssocTok, isSigner: false, isWritable: true},
        {pubkey: mint, isSigner: false, isWritable: true},
        {pubkey: homeAssocTok.value[0].pubkey, isSigner: false, isWritable: true},
        {pubkey: homeWallet, isSigner: false, isWritable: true},
        {pubkey: bankpda, isSigner: false, isWritable: true},
        {pubkey: globalKey, isSigner: true, isWritable: true},
        {pubkey: awayAssocTok.value[0].pubkey, isSigner: false, isWritable: true},
        {pubkey: awayWallet, isSigner: false, isWritable: true}
      ],
  		programId: programID,
	  	data: new Uint8Array([bumpKey, parseInt(id1), parseInt(id2), 99]),
	  });
    transaction.add(instruction);
    x += 1;
    console.log(transaction.serialize({requireAllSignatures: false, verifySignatures: false}).length);
  }
  
  document.getElementById("txsizemsg").innerHTML = "There were " + (accs.length - x) + " accounts left unpushed because of transaction size";
  
	signed = await globalProvider.signTransaction(transaction);
  signature = await connection.sendRawTransaction(signed.serialize());
	await connection.confirmTransaction(signature);
  console.log(signature);
  document.getElementById("gradeSig").innerHTML = signature;
  document.getElementById("gradeSig").setAttribute("href", "https://explorer.solana.com/tx/" + signature);
}

//use by putting this function in the script.js file and calling it from the browser console
async function checkSize(numInstrs){
	var transaction = new solanaWeb3.Transaction();
  transaction.feePayer = globalKey;
  var blockhashObj = await connection.getRecentBlockhash();
	transaction.recentBlockhash = await blockhashObj.blockhash;
  
	for(var x = 0; x < numInstrs; x++){
		var instr = new solanaWeb3.TransactionInstruction({
			keys: [
				{pubkey: globalKey, isSigner: false, isWritable: true},
				{pubkey: globalKey, isSigner: false, isWritable: true},
				{pubkey: programID, isSigner: false, isWritable: true},
				{pubkey: globalKey, isSigner: false, isWritable: true},
				{pubkey: globalKey, isSigner: false, isWritable: true},
				{pubkey: globalKey, isSigner: false, isWritable: true},
				{pubkey: globalKey, isSigner: false, isWritable: true},
				{pubkey: globalKey, isSigner: false, isWritable: true},
				{pubkey: globalKey, isSigner: false, isWritable: true},
        {pubkey: globalKey, isSigner: false, isWritable: true},
			],
			programId: programID,
			data: new Uint8Array([254, 1, 189, 1]),
		});
		transaction.add(instr);
    var message = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHrMemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHrhomeTeam vs awayTeam winning result"
    var memo = new solanaWeb3.TransactionInstruction({
          keys: [],
          data: Uint8Array.from(message.split("").map(x => x.charCodeAt())),
          programId: new solanaWeb3.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
        });
    //transaction.add(memo);
    //this can't work, transaction is too large
	}
	console.log(transaction.serialize({requireAllSignatures: false, verifySignatures: false}).length);
	//sign the transaction and send it, to see if that increases the transaction size
	//and then print the size of the serialized signed transaction
  var signed = await globalProvider.signTransaction(transaction);
	console.log(signed.serialize().length);
  //signing does not change transaction size
}
