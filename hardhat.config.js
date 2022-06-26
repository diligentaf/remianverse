require("@nomiclabs/hardhat-waffle");
const fs = require("fs")
const file = JSON.parse(fs.readFileSync('.secret', 'utf8'));
const privateKey = file.privateKey.toString()

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.9",
  settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
  // defaultNetwork: "ganache",
  networks: {
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      chainId: 4,
      gasPrice: 20e9,
      gas: 25e6,
      accounts: [privateKey]
    },
    ganache: {
      url: "http://127.0.0.1:7545",
    },
  },
};
