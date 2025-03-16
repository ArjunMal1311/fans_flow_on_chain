import { ethers } from "hardhat";

export default async ({ getNamedAccounts, deployments }: { getNamedAccounts: any, deployments: any }) => {

    console.log("Deploying contracts...");
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const [defaultAdmin, minter] = await ethers.getSigners();

    const mockUSD = await deploy('MockUSD', {
        from: deployer,
        args: [deployer],
        log: true,
    });

    const NFT = await deploy('NFT', {
        from: deployer,
        args: [defaultAdmin.address, minter.address],
        log: true,
    });

    const nftMarketplace = await deploy('MarketPlace', {
        from: deployer,
        args: [NFT.address, mockUSD.address],
        log: true,
    });

    const NFTContract = await ethers.getContractAt('NFT', NFT.address);
    const MINTER_ROLE = await NFTContract.MINTER_ROLE();
    const grantRoleTx = await NFTContract.grantRole(MINTER_ROLE, nftMarketplace.address);
    await grantRoleTx.wait();
    console.log(`Granted MINTER_ROLE to marketplace at: ${nftMarketplace.address}`);
};

module.exports.tags = ['NFTDeployment'];
