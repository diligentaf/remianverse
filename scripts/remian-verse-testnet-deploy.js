const { expect } = require("chai");
const { id } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const crypto = require("crypto");

async function main() {
  console.log("deployment starting... ");
  let Household, usd, rg, king;
  let household = [];
  let amount = ethers.utils.parseEther("0.01");
  let monthlyAmount = amount.toBigInt() * BigInt(3);

  // creating private key
  var uid = crypto.randomBytes(32).toString("hex");
  var privateKey = "0x" + uid;
  king = new ethers.Wallet(privateKey);
  console.log("address of king generated : ", king.address);

  const USDContract = await ethers.getContractFactory("USD");
  usd = await USDContract.deploy();
  console.log("address of stablecoin : ", usd.address);

  Household = await ethers.getContractFactory("Household");

  const RemianGod = await ethers.getContractFactory("RemianGod");
  rg = await RemianGod.deploy();
  console.log("address of Remian God : ", rg.address);

  tx = await rg.create(usd.address, "Remian APT 103-1101", monthlyAmount);
  receipt = await tx.wait()
  gasUsed = receipt.gasUsed.toBigInt()
  console.log('cloning a household smart contract gas used :', receipt.gasUsed.toBigInt())

  household.push(await Household.attach(await rg.households(0)));

  tx = await rg.addFirstMember(household[0].address, king.address, "KING_ROLE");
  receipt = await tx.wait()
  gasUsed = receipt.gasUsed.toBigInt()
  console.log('adding first member gas used : ', receipt.gasUsed.toBigInt())
  // expect(await household[0].getSize()).to.equal(1);
  // expect(await household[0].getRole(0)).to.equal(id("KING_ROLE"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
