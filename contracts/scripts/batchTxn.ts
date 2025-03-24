import { ethers } from "hardhat";

const purchaseSubscriptionAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const mockUsdAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

async function checkBalances(mockUsd: any) {
  const signers = await ethers.getSigners();
  const signer = signers[0];
  const signerAddress = signer.address;

  const subscriptionBalance = ethers.formatUnits(
    await mockUsd.balanceOf(purchaseSubscriptionAddress),
    8
  );
  console.log(
    `PurchaseSubscription ${purchaseSubscriptionAddress} has a balance of: ${subscriptionBalance} mUSD`
  );

  const signerBalance = ethers.formatUnits(
    await mockUsd.balanceOf(signerAddress),
    8
  );
  console.log(
    `Account ${signerAddress} has a balance of: ${signerBalance} mUSD`
  );
}

async function batchSubscribe(mockUsd: any, modelId: number, subscriptionId: number, priceInUsd: number) {
  await checkBalances(mockUsd);
  const priceInMinUnits = ethers.parseUnits(priceInUsd.toString(), 8);

  const purchaseSubscription = await ethers.getContractAt(
    "contracts/CrossChainAggregator/SourcePurchaseSubscription.sol:PurchaseSubscription",
    purchaseSubscriptionAddress
  );

  // Create instance of Batch.sol
  const batchAddress = "0x0000000000000000000000000000000000000808";
  const batch = await ethers.getContractAt("Batch", batchAddress);

  const approvalCallData = mockUsd.interface.encodeFunctionData("approve", [
    purchaseSubscriptionAddress,
    priceInMinUnits,
  ]);
  const subscribeCallData = purchaseSubscription.interface.encodeFunctionData(
    "subscribeWithToken",
    [modelId, subscriptionId, priceInMinUnits]
  );

  // console.log(approvalCallData, subscribeCallData);

  const batchTx = await batch.batchAll(
    [mockUsdAddress, purchaseSubscriptionAddress],
    [],
    [approvalCallData, subscribeCallData],
    []
  );
  await batchTx.wait();
  console.log(`Batch executed for approval and subscription: ${batchTx.hash}`);

  await checkBalances(mockUsd);

}

async function main() {
  const mockUsd = await ethers.getContractAt(
    "MockUSD",
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  );

  const modelId = 2;
  const subscriptionId = 1;
  const priceInUsd = 1;

  await batchSubscribe(mockUsd, modelId, subscriptionId, priceInUsd);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });