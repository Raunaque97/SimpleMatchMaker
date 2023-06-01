require("dotenv").config();
const Web3 = require("web3");
let web3 = new Web3("https://ethereum.blockpi.network/v1/rpc/public");

const port = process.env.PORT || 3000;
// const url = "http://localhost:" + port + "/";
const url = "https://simple-mm.cyclic.app/";

async function getPlayerRequest() {
  let player = web3.eth.accounts.create(["seed"]);
  // generate a random proxy address
  let proxyAddr = web3.eth.accounts.create(["seed1"]).address;
  let wager = 1e6;
  let validUntil = Math.floor(Date.now() / 1000) + 60; // in epoch seconds
  // sign the data
  const msgHash = web3.utils.soliditySha3(
    web3.utils.encodePacked(
      { value: player.address, type: "address" },
      { value: proxyAddr, type: "address" },
      { value: wager, type: "uint256" },
      { value: validUntil, type: "uint256" }
    )
  );
  let sign = (await web3.eth.accounts.sign(msgHash, player.privateKey))
    .signature;

  return JSON.stringify({
    addr: player.address,
    proxyAddr: proxyAddr,
    wager: wager,
    validUntil: validUntil,
    sign: sign,
  });
}

(async () => {
  try {
    let params = await getPlayerRequest();
    console.log(
      "now " + Date.now(),
      "blockTime " + (await web3.eth.getBlock("latest").timestamp)
    );
    console.log(url + "friendly/" + params);
    // send request to server and get json response
    let response = await fetch(url + "friendly/" + params).then((res) =>
      res.json()
    );
    console.log(response);

    // show test passed in green
    console.log("\x1b[32m%s\x1b[0m", "Test passed");
  } catch (e) {
    console.log("\x1b[31m%s\x1b[0m", "Test failed", e);
  }

  //end program
  process.exit(0);
})();
