var connection = new solanaWeb3.Connection("https://spring-frosty-snowflake.solana-mainnet.discover.quiknode.pro/5584f3ace79637af8f83a6f135554af9e0f0ffca/");


async function showAccs(){
  var programID = new solanaWeb3.PublicKey(document.getElementById("programID").value);
  var display = document.getElementById("display");
  var accs = await connection.getProgramAccounts(programID, {dataSlice: {length: 0, offset: 0}});
  for(var x = 0; x < accs.length; x++){
    var h1 = document.createElement("h1");
    var link = document.createElement("a");
    link.innerHTML = accs[x].pubkey.toBase58();
    link.setAttribute("href", "accdetail.html?" + accs[x].pubkey.toBase58());
    link.setAttribute("target", "_blank");
    h1.appendChild(link);
    display.appendChild(h1);
  }
  document.getElementById("status").innerHTML = "The function was called. ";
}

async function populate(){
  var pubkey = window.location.href.split("?")[1];
  document.getElementById("pubkey").innerHTML = pubkey;

  var keyform = new solanaWeb3.PublicKey(pubkey);
  var info = await connection.getAccountInfo(keyform);
  //document.getElementById("lamports").innerHTML = info.lamports;
  //document.getElementById("sol").innerHTML = info.lamports / 1000000000;

  var homeStake = (info.data[2] * 256 + info.data[3]) / 100;
  var awayStake = (info.data[4] * 256 + info.data[5]) / 100;
  var totalStake = homeStake + awayStake;
  var homeOdds = totalStake / homeStake;
  var awayOdds = totalStake / awayStake;

  document.getElementById("homeStake").innerHTML = "$" + homeStake;
  document.getElementById("homeOdds").innerHTML = homeOdds;

  document.getElementById("awayStake").innerHTML = "$" + awayStake;
  document.getElementById("awayOdds").innerHTML = awayOdds;
  
  document.getElementById("home").innerHTML = new solanaWeb3.PublicKey(info.data.slice(6, 38)).toBase58();
  document.getElementById("away").innerHTML = new solanaWeb3.PublicKey(info.data.slice(38, 70)).toBase58();

  var pbid = info.data[0] * 256 + info.data[1];
  
  var fixtureCall = new XMLHttpRequest();
  fixtureCall.open("GET", "https://o9hxyxzok0.execute-api.ap-northeast-1.amazonaws.com/pendingbets?pbids=" + pbid, false);
  fixtureCall.send();
  var fixtureRaw = fixtureCall.response;
  var fixtureJSON = JSON.parse(fixtureRaw);
  var fixture = fixtureJSON[pbid].event;
  var homeTeam = fixtureJSON[pbid].homeTeam;
  var awayTeam = fixtureJSON[pbid].awayTeam;
  
  document.getElementById("pbid").innerHTML = pbid + ": " + fixture + ", mkt: " + homeTeam + "/" + awayTeam;
  
  var data = document.getElementById("data");
  for(var x = 0; x < info.data.length; x++){
    var le = document.createElement("li");
    le.innerHTML = info.data[x];
    data.appendChild(le);  
  }
}

