var connection = new solanaWeb3.Connection("https://spring-frosty-snowflake.solana-mainnet.discover.quiknode.pro/5584f3ace79637af8f83a6f135554af9e0f0ffca/");
var programID = new solanaWeb3.PublicKey("39mBcnQ27QA9nNZmM6VrumE2vtqs5v3HD7t7RGv9kXUV");

async function showAccsFromInput(){
  var id1 = document.getElementById("id1").value;
  var id2 = document.getElementById("id2").value;
  var pbid = document.getElementById("pbid").value;
  if(pbid != ""){
    id1 = Math.floor(pbid / 256);
    id2 = pbid % 256;
  }
  await showAccs(id1, id2);
}

async function showAccsOnLoad(){ 
}


async function showAccs(id1, id2){
  var b58id = base58.encode([id1, id2]);
  var accs = await connection.getProgramAccounts
    (programID, 
      {filters:
       [
        {memcmp: {offset: 0, bytes: b58id} }, 
       ],
       dataSlice: {length: 0, offset: 0}
      }
    );
  var display = document.getElementById("display");
  display.innerHTML = "";
  for(var x = 0; x < accs.length; x++){
    var h1 = document.createElement("h1");
    var link = document.createElement("a");
    link.innerHTML = accs[x].pubkey.toBase58();
    link.setAttribute("href", "https://utils.mbdqwfss.repl.co/accdetail.html?" + accs[x].pubkey.toBase58());
    link.setAttribute("target", "_blank");
    h1.appendChild(link);
    display.appendChild(h1);
  }
  document.getElementById("finishmsg").innerHTML = "The function has finished for " + id1 + " " + id2;
}