import { expect } from "chai";
import { ethers } from "hardhat";

describe("Marketplace", function () {
    let Marketplace, marketplace: any, owner: any, addr1: any, mockUSD: any, MockUSD: any, NFT: any, nft: any;


    const modelIds = Array.from({ length: 16 }, (_, i) => i + 1);
    const pricesUSD = Array.from({ length: 16 }, () => (Math.floor(Math.random() * 10) + 1) * 100000000);
    const associatedAddresses = Array.from({ length: 16 }, () => "0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    const royaltyFees = Array(16).fill(500);

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        MockUSD = await ethers.getContractFactory("MockUSD");
        mockUSD = await MockUSD.deploy(owner.address);
        await mockUSD.waitForDeployment();
        const mockUSDAddress = await mockUSD.getAddress();
        // console.log("MockUSD deployed to:", mockUSDAddress);

        NFT = await ethers.getContractFactory("NFT");
        nft = await NFT.deploy(owner.address, owner.address);
        await nft.waitForDeployment();
        const nftAddress = await nft.getAddress();
        // console.log("NFT deployed to:", nftAddress);

        Marketplace = await ethers.getContractFactory("MarketPlace");
        marketplace = await Marketplace.deploy(nftAddress, mockUSDAddress);
        await marketplace.waitForDeployment();
        // console.log("Marketplace deployed to:", await marketplace.getAddresss());

        await marketplace.updateBatchModels(modelIds, pricesUSD, associatedAddresses, royaltyFees);
    });

    it("Should update models correctly", async function () {
        for (let i = 0; i < modelIds.length; i++) {
            const model = await marketplace.models(modelIds[i]);
            expect(model.priceUSD).to.equal(pricesUSD[i]);
            expect(model.associatedAddress).to.equal(associatedAddresses[i]);
            expect(model.royaltyFees).to.equal(royaltyFees[i]);
        }
    })

    it("Should list and buy NEFT with ETH correctly", async function () {
        await nft.mint(addr1.address, 1, 1, 1, 86400, 500, addr1.address, "0x");
        const tokenId = await nft._encodeTokenId(1, 1);
        const marketplaceAddress = await marketplace.getAddress();

        await nft.connect(addr1).setApprovalForAll(marketplaceAddress, true);
        const listingId = await marketplace.getTotalListingIds();
        await marketplace.connect(addr1).listNFT(tokenId, ethers.parseUnits("1", 18));

        await marketplace.buyNFT(listingId, { value: ethers.parseUnits("1", 18) });

        expect(await nft.balanceOf(addr1.address, tokenId)).to.equal(0);
        expect(await nft.balanceOf(owner.address, tokenId)).to.equal(1);
    });

    it("Should buy NFT with USDC correctly", async function () {
        await nft.mint(addr1.address, 1, 1, 1, 86400, 500, addr1.address, "0x");
        const tokenId = await nft._encodeTokenId(1, 1);
        const marketplaceAddress = await marketplace.getAddress();

        await nft.connect(addr1).setApprovalForAll(marketplaceAddress, true);
        const listingId = await marketplace.getTotalListingIds();
        await marketplace.connect(addr1).listNFT(tokenId, pricesUSD[0]);

        await mockUSD.mint(owner.address, pricesUSD[0]);
        await mockUSD.approve(marketplaceAddress, pricesUSD[0]);

        await marketplace.buyNFTWithUSDC(listingId);

        expect(await nft.balanceOf(addr1.address, tokenId)).to.equal(0);
        expect(await nft.balanceOf(owner.address, tokenId)).to.equal(1);
    });
});