require("dotenv").config();
const Koa = require("koa");
const Router = require("@koa/router");
const Web3 = require("web3");
let web3 = new Web3();

const app = new Koa();
const router = new Router();
const port = process.env.PORT || 3000;

//   const privateKey = PrivateKey.fromBase58(process.env.PRIVATE_KEY);
//   const publicKey = privateKey.toPublicKey();

const queue = new Map();
let waitingCount = 0;

router.get("/friendly/:data(.*)", async (ctx) => {
  try {
    ctx.body = await getMatch(ctx.params.data);
  } catch (e) {
    ctx.body = { error: e.message };
  }
});
app.use(router.routes()).use(router.allowedMethods());
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

async function getMatch(data) {
  // deserialize the data
  const { addr, proxyAddr, wager, validUntil, sign } = JSON.parse(data);
  if (validUntil < Date.now()) {
    console.log("\x1b[31m%s\x1b[0m", "Expired validUntil");
    throw new Error("Expired");
  }
  let msgHash = web3.utils.soliditySha3(
    web3.utils.encodePacked(
      { value: addr, type: "address" },
      { value: proxyAddr, type: "address" },
      { value: wager, type: "uint256" },
      { value: validUntil, type: "uint256" }
    )
  );
  if (web3.eth.accounts.recover(msgHash, sign) !== addr) {
    console.log("\x1b[31m%s\x1b[0m", "Invalid signature");
    throw new Error("Invalid signature");
  }
  if (queue.has(wager)) {
    // pop from the queue a player with validUntil > now
    let matchReq = queue.get(wager).pop();
    // discard bad requests
    while (
      matchReq &&
      (matchReq.validUntil < Date.now() || matchReq.addr === addr)
    ) {
      // TODO add buffer time to validUntil
      matchReq = queue.get(wager).pop();
      waitingCount--;
    }
    if (matchReq) {
      console.log(
        "\x1b[32m%s\x1b[0m",
        "Matched :" +
          matchReq.addr.substring(0, 5) +
          " vs " +
          addr.substring(0, 5)
      );
      waitingCount--;
      return {
        wait: false,
        opponent: matchReq,
      };
    }
  }
  // no match found, add player to queue
  queue.set(wager, [{ addr, proxyAddr, wager, validUntil, sign }]);
  waitingCount++;
  console.log("[" + wager + "] Waiting count: " + waitingCount);
  return {
    wait: true,
  };
}
