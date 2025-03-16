import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DEFAULT_ADMIN_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const MINTER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const OWNER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export default buildModule("CombinedModule", (m: any) => {
  const NFT = m.contract("NFT", [DEFAULT_ADMIN_ADDRESS, MINTER_ADDRESS]);
  const mockUSD = m.contract("MockUSD", [OWNER_ADDRESS]);
  const nftMarketplace = m.contract("MarketPlace", [NFT, mockUSD]);
  
  const MINTER_ROLE = m.staticCall(NFT, "MINTER_ROLE", []);
  m.call(NFT, "grantRole", [MINTER_ROLE, nftMarketplace]);

  const modelIds = Array.from({ length: 16 }, (_, i) => i + 1);
  const pricesUSD = Array.from({ length: 16 }, () => (Math.floor(Math.random() * 10) + 1) * 100000000);
  const associatedAddresses = Array.from({ length: 16 }, () => DEFAULT_ADMIN_ADDRESS);
  const royaltyFees = Array(16).fill(500);

  m.call(nftMarketplace, "updateBatchModels", [modelIds, pricesUSD, associatedAddresses, royaltyFees]);

  return { blockTeaseNFTs: NFT, mockUSD, nftMarketplace };
});