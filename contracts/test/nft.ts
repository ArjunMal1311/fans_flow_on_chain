const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT", function () {
    let nfts, nft: any, owner: any, minter: any, addr1: any;

    beforeEach(async function () {
        [owner, minter, addr1] = await ethers.getSigners();
        nfts = await ethers.getContractFactory("NFT");
        nft = await nfts.deploy(owner.address, minter.address);
        await nft.waitForDeployment();
    });

    it("Should set the right roles", async function () {
        expect(await nft.hasRole(await nft.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        expect(await nft.hasRole(await nft.MINTER_ROLE(), minter.address)).to.be.true;
    });

    it("Should mint tokens correctly with royalty info", async function () {
        const modelId = 1, subscriptionId = 1, amount = 1, duration = 86400, royaltyFee = 500;
        await nft.connect(minter).mint(addr1.address, modelId, subscriptionId, amount, duration, royaltyFee, addr1.address, "0x");
        const tokenId = await nft._encodeTokenId(modelId, subscriptionId);
        const expirationTime = await nft.expirationTimes(tokenId);

        expect(expirationTime).to.be.gt(0);
        const [receiver, fee] = await nft.royaltyInfo(tokenId, 10000);
        expect(receiver).to.equal(addr1.address);
        expect(fee).to.equal(500);
    });

    it("Only minter should mint tokens", async function () {
        await expect(nft.connect(addr1).mint(addr1.address, 1, 1, 1, 86400, 500, addr1.address, "0x")).to.be.revertedWithCustomError(nft, "AccessControlUnauthorizedAccount")
            .withArgs(addr1.address, await nft.MINTER_ROLE());
    });
})