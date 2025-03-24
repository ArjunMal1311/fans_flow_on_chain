import { ethers } from "hardhat";

export default async ({ getNamedAccounts, deployments }: { getNamedAccounts: any, deployments: any }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const [defaultAdmin, minter] = await ethers.getSigners();
  
    // Deploy MockUSD contract
    const mockUSD = await deploy('MockUSD', {
      from: deployer,
      args: [deployer],
      log: true,
    });
  
    const blockTeaseNFTs = await deploy('BlockTeaseNFTs', {
      from: deployer,
      args: [defaultAdmin.address, minter.address],
      log: true,
    });

    // For local testing, we'll deploy a mock price feed
    const mockPriceFeed = await deploy('MockV3Aggregator', {
      from: deployer,
      args: [8, 200000000000], // 8 decimals, initial price $2000.00000000
      log: true,
    });

    // CCIP Router address - this should be replaced with the actual router address for the network you're deploying to
    const routerAddress = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0"; // Example router address
  
    // Deploy NFTMarketplace contract
    const nftMarketplace = await deploy('NFTMarketplace', {
      from: deployer,
      args: [mockPriceFeed.address, routerAddress, blockTeaseNFTs.address, mockUSD.address],
      log: true,
    });

    // Deploy NFTMarketplaceAutomation contract
    const nftMarketplaceAutomation = await deploy('NFTMarketplaceAutomation', {
      from: deployer,
      args: [mockPriceFeed.address, routerAddress, blockTeaseNFTs.address, mockUSD.address],
      log: true,
    });
  
    // Grant MinterRole to both marketplace contracts
    const blockTeaseNFTsContract = await ethers.getContractAt('BlockTeaseNFTs', blockTeaseNFTs.address);
    const MINTER_ROLE = await blockTeaseNFTsContract.MINTER_ROLE();
    
    const grantRoleTx1 = await blockTeaseNFTsContract.grantRole(MINTER_ROLE, nftMarketplace.address);
    await grantRoleTx1.wait();
    console.log(`Granted MINTER_ROLE to marketplace at: ${nftMarketplace.address}`);

    const grantRoleTx2 = await blockTeaseNFTsContract.grantRole(MINTER_ROLE, nftMarketplaceAutomation.address);
    await grantRoleTx2.wait();
    console.log(`Granted MINTER_ROLE to marketplace automation at: ${nftMarketplaceAutomation.address}`);
};

module.exports.tags = ['NFTDeployment'];
