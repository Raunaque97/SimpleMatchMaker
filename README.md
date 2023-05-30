# SimpleMatchMaker

It's part of project/game Ronin's Gambit

## How to use / API Overview

- **`/friendly/:data`:**

  - `data` is a stringified json object of the form `{ addr, proxyAddr, wager, validUntil, sign }`
  - return a json object with `wait == true` if no match is found, otherwise return a json object with `wait == false` and opponent object `{ addr, proxyAddr, wager, validUntil, sign }`

  blockchain is the source of truth on whether a match started or not
  so the client who didn't received a opponent object should watch the blockchain to see if a match started till `validUntil` is reached

  Player who received a opponent object can start a match immediately but calling the appropriate function on the game contract

### How to test

deploy the server on localhost then test using `node test/localTest.js`
