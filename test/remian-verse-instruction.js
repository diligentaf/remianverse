const { expect } = require("chai");
const { id } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

describe("RemianVerse Scenario", function () {
  let accounts, Household, usd, rg, janitor, king, bishop, pun;
  let household = [];
  let amount = ethers.utils.parseEther('100');
  let fastforward30days = 30 * 24 * 60 * 60;
  let monthlyAmount = amount.toBigInt() * BigInt(3)

  before("attaching USD stable coin && relevant solidity codes", async function () {
    accounts = await hre.ethers.getSigners();
    janitor = accounts[19];
    (king = accounts[0]),
      (bishop = accounts[1]),
      (pun = accounts[2]),
      (pun2 = accounts[3]);
    const USDContract = await ethers.getContractFactory("USD");
    usd = await USDContract.connect(janitor).deploy();
    Household = await ethers.getContractFactory("Household");
    for (var i = 0; i < accounts.length - 1; i++) {
      await usd.connect(janitor).transfer(accounts[i].address, ethers.utils.parseEther('1000'));
    }
  });

  it("deploy RemianGod's smart contract", async function () {
    const RemianGod = await ethers.getContractFactory("RemianGod");
    rg = await RemianGod.connect(janitor).deploy();
  });

  it("cloning household contract and saving the address in array", async function () {
    await rg.connect(janitor).create(usd.address, "Remian APT 103-1101", monthlyAmount);
    household.push(await Household.attach(await rg.households(0)));
  });

  it("Remian God adding the first member of the household", async function () {
    await rg
      .connect(janitor)
      .addFirstMember(household[0].address, king.address, "KING_ROLE");
    expect(await household[0].getSize()).to.equal(1);
    expect(await household[0].getRole(0)).to.equal(id("KING_ROLE"));
  });

  it("household's king adding bishop members", async function () {
    await household[0].connect(king).addMember(bishop.address, "BISHOP_ROLE");
  });

  it("verifying account role is given with BISHOP_ROLE", async function () {
    expect(await household[0].getRole(1)).to.equal(id("BISHOP_ROLE"));
  });

  it("household's bishop adding a pun", async function () {
    await household[0].connect(bishop).addMember(pun.address, "PUN_ROLE");
  });

  it("verifying account role is given with PUN_ROLE", async function () {
    expect(await household[0].getRole(2)).to.equal(id("PUN_ROLE"));
  });

  it("household's pun adding a pun", async function () {
    await household[0].connect(pun).addMember(pun2.address, "PUN_ROLE");
  });

  it("verifying account role is given with PUN_ROLE", async function () {
    expect(await household[0].getRole(3)).to.equal(id("PUN_ROLE"));
  });

  it("attempting to add a member with non-household account rejects a transaction", async function () {
    await expect(
      household[0].connect(janitor).addMember(accounts[9].address, "PUN_ROLE")
    ).to.be.revertedWith("not a member");
  });

  it("verifying there are 4 members in a household", async function () {
    expect(await household[0].getSize()).to.equal(4);
  });

  it("removing a king rejects the request", async function () {
    await expect(
      household[0].connect(bishop).removeMember(king.address)
    ).to.be.revertedWith("king or bishop cannot be removed");
  });

  it("pun attempting to remove bishop rejects the request", async function () {
    await expect(
      household[0].connect(bishop).removeMember(bishop.address)
    ).to.be.revertedWith("king or bishop cannot be removed");
  });

  it("king removing a member rejects the request", async function () {
    await expect(
      household[0].connect(king).removeMember(pun.address)
    ).to.be.revertedWith("not a bishop");
  });

  it("removing a member with pun account rejects the action", async function () {
    await expect(
      household[0].connect(pun).removeMember(pun2.address)
    ).to.be.revertedWith("not a bishop");
  });

  it("removing a pun account with bishop", async function () {
    await household[0].connect(bishop).removeMember(pun2.address);
  });

  it("verifying there are 3 members in a household", async function () {
    expect(await household[0].getSize()).to.equal(3);
  });

  it("funding household contract with king account", async function () {
    await usd.connect(king).approve(household[0].address, amount);
    await household[0].connect(king).fundUtilities(amount);
    expect(BigInt(await usd.balanceOf(household[0].address))).to.equal(BigInt(amount));
  });

  it("funding household contract with bishop account", async function () {
    await usd.connect(bishop).approve(household[0].address, amount);
    await household[0].connect(bishop).fundUtilities(amount);
    expect(BigInt(await usd.balanceOf(household[0].address))).to.equal(BigInt(amount * 2));
  });

  it("funding household contract with pun account", async function () {
    await usd.connect(pun).approve(household[0].address, amount.toBigInt() * BigInt(4));
    await household[0].connect(pun).fundUtilities(amount.toBigInt() * BigInt(4));
    expect(BigInt(await usd.balanceOf(household[0].address))).to.equal(amount.toBigInt() * BigInt(6));
  });

  it("withdrawing funds from Household contract to king account", async function () {
    let householdBalance = BigInt(await usd.balanceOf(household[0].address));
    let kingBalance = BigInt(await usd.balanceOf(king.address));
    await household[0].connect(king).withdrawFund(amount);
    expect(await usd.balanceOf(household[0].address)).to.equal(
      householdBalance - amount.toBigInt()
    );
    expect(BigInt(await usd.balanceOf(accounts[0].address))).to.equal(
      kingBalance + amount.toBigInt()
    );
  });

  it("attempting to withdraw more than household contract's balance reverts an error", async function () {
    await expect(
      household[0].connect(king).withdrawFund(BigInt(await usd.balanceOf(household[0].address)) + BigInt(amount))
    ).to.be.revertedWith("not enough fund");
  });

  it("attempting to withdraw with bishop account reverts an error", async function () {
    await expect(
      household[0].connect(bishop).withdrawFund(BigInt(await usd.balanceOf(household[0].address)) + BigInt(amount))
    ).to.be.revertedWith("not a king");
  });

  it("attempting to withdraw with pun account reverts an error", async function () {
    await expect(
      household[0].connect(pun).withdrawFund(BigInt(await usd.balanceOf(household[0].address)) + BigInt(amount))
    ).to.be.revertedWith("not a king");
  });

  it("fast forwarding to 30 days later and checking whether liabilities have increased by 1", async function () {
    await network.provider.send("evm_increaseTime", [fastforward30days]);
    await network.provider.send("evm_mine", []);
    expect(await household[0].checkLiabilities()).to.equal(1);
  });

  it("fast forwarding to 30 days later and checking whether liabilities have increased by 2", async function () {
    await network.provider.send("evm_increaseTime", [fastforward30days]);
    await network.provider.send("evm_mine", []);
    expect(await household[0].checkLiabilities()).to.equal(2);
  });

  it("paying monthly utility bill", async function () {
    let householdBalance = BigInt(await usd.balanceOf(household[0].address));
    let remianBalance = BigInt(await usd.balanceOf(rg.address));
    await household[0].connect(king).payUtilityBill();
    expect(BigInt(await usd.balanceOf(household[0].address))).to.equal(
      householdBalance - monthlyAmount
    );
    expect(BigInt(await usd.balanceOf(rg.address))).to.equal(remianBalance + monthlyAmount);
  });

  it("checking whether liabilities have decreased", async function () {
    expect(await household[0].checkLiabilities()).to.equal(1);
  });

  it("fast forwarding to 6 months later and checking whether liabilities have increased by 6 unpaid utility bills", async function () {
    await network.provider.send("evm_increaseTime", [fastforward30days * 5]);
    await network.provider.send("evm_mine", []);
    expect(
      await rg.connect(janitor).checkLiabilities(household[0].address)
    ).to.equal(6);
  });

  it("distraining the household", async function () {
    householdBalance = await usd.balanceOf(household[0].address);
    remianGodBalance = await usd.balanceOf(rg.address);
    await rg.distrainHousehold(household[0].address);
    expect(BigInt(await usd.balanceOf(rg.address))).to.equal(BigInt(householdBalance) + BigInt(remianGodBalance))
  });

});
