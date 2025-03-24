import { ethers } from "ethers";
import { PaymasterMode } from "@biconomy/account";
import { approveNSubscribeProps, batchSubscribeProps, MintingNFTProps } from "@/utils/types";
import marketPlaceABI from "../abis/NFTMarketplace.json"
import userOnboardingABI from "../abis/UserOnboarding.json"
import mockUSDABI from "../abis/MockUSD.json"
import batchABI from "../abis/Batch.json"
import precompileABI from "../abis/Precompile.json"
import NFTABI from "../abis/BlockTeaseNFTs.json"
import marketplaceAutomationABI from "../abis/NFTMarketplaceAutomation.json"

const mockUSDAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
const userOnboardingAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const NFTAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
const marketPlace = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
const batchAddress = '0x0000000000000000000000000000000000000808';
const precompileAddress = '0x000000000000000000000000000000000000080a';
const purchaseSubscription = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
const mockV3AggregatorAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
const marketplaceAutomationAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"

let currentProvider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
let currentSigner: ethers.providers.JsonRpcSigner | null = null;

export async function getTestUSDC(targetAddress: string, amount: string = "10000") {
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    
    const accounts = await provider.listAccounts();
    const adminAddress = accounts[0];

    try {
        await provider.send('hardhat_impersonateAccount', [adminAddress]);
        const adminSigner = provider.getSigner(adminAddress);
        
        const mockUsd = new ethers.Contract(
            mockUSDAddress,
            mockUSDABI,
            adminSigner
        );

        console.log('Minting USDC to admin account...');
        const mintAmount = ethers.utils.parseUnits("1000000", 8);
        const mintTx = await mockUsd.mint(adminAddress, mintAmount);
        await mintTx.wait();
        console.log('Minted USDC to admin account');

        const amountInMinUnits = ethers.utils.parseUnits(amount, 8);
        console.log(`Transferring ${amount} USDC to ${targetAddress}...`);
        
        const currentBalance = await mockUsd.balanceOf(targetAddress);
        const currentBalanceFormatted = ethers.utils.formatUnits(currentBalance, 8);
        console.log(`Current balance of recipient: ${currentBalanceFormatted} USDC`);

        const adminBalance = await mockUsd.balanceOf(adminAddress);
        console.log(`Admin balance: ${ethers.utils.formatUnits(adminBalance, 8)} USDC`);
        
        const tx = await mockUsd.transfer(targetAddress, amountInMinUnits);
        const receipt = await tx.wait();
        
        console.log('USDC transfer confirmed:', receipt.transactionHash);
        
        const newBalance = await mockUsd.balanceOf(targetAddress);
        const newBalanceFormatted = ethers.utils.formatUnits(newBalance, 8);
        console.log(`New balance of recipient: ${newBalanceFormatted} USDC`);

        await provider.send('hardhat_stopImpersonatingAccount', [adminAddress]);
        
        return {
            transactionHash: receipt.transactionHash,
            newBalance: newBalanceFormatted,
            previousBalance: currentBalanceFormatted
        };
    } catch (error) {
        try {
            await provider.send('hardhat_stopImpersonatingAccount', [adminAddress]);
        } catch (e) {
        }
        console.error('Error getting test USDC:', error);
        throw error;
    }
}


export async function listNft(tokenId: string, priceInUsdString: string) {
    console.log('Starting listNft');
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();

    const nftContractInstance = new ethers.Contract(
        NFTAddress,
        NFTABI,
        signer
    );
    const marketplaceContract = new ethers.Contract(
        marketPlace,
        marketPlaceABI,
        signer
    );

    const tokenIdBN = ethers.BigNumber.from(tokenId);
    const priceInUsdc = ethers.utils.parseUnits(priceInUsdString, 8);

    try {
        const balance = await nftContractInstance.balanceOf(signerAddress, tokenIdBN);
        if (balance.eq(0)) {
            throw new Error("You don't own this NFT");
        }

        console.log(
            `Listing NFT with ID: ${tokenIdBN.toString()} at price: ${priceInUsdString} USD (Balance: ${balance.toString()})`
        );

        console.log('Approving marketplace to manage NFT...');
        const approveTx = await nftContractInstance.setApprovalForAll(marketPlace, true);
        const approveReceipt = await approveTx.wait();
        console.log('Approval confirmed:', approveReceipt.transactionHash);

        console.log('Listing NFT...');
        const listTx = await marketplaceContract.listNFT(tokenIdBN, priceInUsdc);
        const listReceipt = await listTx.wait();
        console.log('Listing confirmed:', listReceipt.transactionHash);

        return {
            approvalHash: approveReceipt.transactionHash,
            listingHash: listReceipt.transactionHash,
            tokenId: tokenId,
            price: priceInUsdString,
            balance: balance.toString()
        };
    } catch (error) {
        console.error('Error in listing NFT:', error);
        throw error;
    }
}


export async function mintingNft({ modelId, subscriptionId, duration, fromAddress }: MintingNFTProps) {
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    console.log('Provider initialized');

    const signer = provider.getSigner();
    console.log('Signer:', await signer.getAddress());

    const nftMarketPlace = new ethers.Contract(
        marketPlace,
        marketPlaceABI,
        signer
    );
    console.log('NFT Marketplace contract initialized');

    try {
        console.log('Minting NFT...');
        const txResponse = await nftMarketPlace.mintUnsafe(
            modelId,
            subscriptionId,
            duration,
            fromAddress
        );
        console.log('Transaction sent:', txResponse.hash);
        
        const resp = await txResponse.wait();
        console.log('Transaction confirmed:', resp.transactionHash);

        const purchaseEvent = resp.events?.find((e: any) => e.event === 'SubscriptionPurchased');
        const tokenId = purchaseEvent?.args ? purchaseEvent.args[3] : null;

        return { 
            trxHash: resp.transactionHash,
            tokenId: tokenId ? tokenId.toString() : undefined
        };
    } catch (error) {
        console.error('Error minting NFT:', error);
        throw error;
    }
}

export const userOnBoarding = async (name: string | undefined, smartAccount: any) => {
    try {
        const contractAddress = userOnboardingAddress;
        const provider = new ethers.providers.JsonRpcProvider(
            'http://127.0.0.1:8545'
        );
        const contractInstance = new ethers.Contract(
            contractAddress,
            userOnboardingABI,
            provider
        );
        const tokenId = await contractInstance.getTokenId();
        const minTx = await contractInstance.populateTransaction.sendRequest(
            8292,
            [name],
            300000
        );
        console.log('Mint Tx Data', minTx.data);
        const tx1 = {
            to: contractAddress,
            data: minTx.data,
        };

        const userOpResponse = await smartAccount.sendTransaction(tx1, {
            paymasterServiceData: { mode: PaymasterMode.SPONSORED },
        });

        const { transactionHash } = await userOpResponse.waitForTxHash();
        console.log('Transaction Hash', transactionHash);

        if (transactionHash) {
            return { hash: transactionHash, tokenId: tokenId };
        }
    } catch (error) {
        console.log(error);
    }
};


export async function switchSigner(accountIndex: number) {
    try {
        const accounts = await currentProvider.listAccounts();
        if (accountIndex >= 0 && accountIndex < accounts.length) {
            const targetAccount = accounts[accountIndex];
            
            if (currentSigner) {
                try {
                    const currentAddress = await currentSigner.getAddress();
                    await currentProvider.send('hardhat_stopImpersonatingAccount', [currentAddress]);
                } catch (e) {
                }
            }

            await currentProvider.send('hardhat_impersonateAccount', [targetAccount]);
            await currentProvider.send('hardhat_setBalance', [
                targetAccount,
                '0x100000000000000000000000000000000'
            ]);

            currentSigner = currentProvider.getSigner(targetAccount);
            const signerAddress = await currentSigner.getAddress();
            
            if (signerAddress.toLowerCase() !== targetAccount.toLowerCase()) {
                throw new Error('Account switch verification failed');
            }

            console.log('Successfully switched to account:', signerAddress);
            return targetAccount;
        } else {
            throw new Error('Invalid account index');
        }
    } catch (error) {
        console.error('Error switching account:', error);
        throw error;
    }
}

export async function BuyNft(tokenId: string) {
    console.log('Starting to buy NFT with ID:', tokenId);

    if (!currentSigner) {
        throw new Error('No account selected. Please switch to an account first.');
    }

    try {
        const signerAddress = await currentSigner.getAddress();
        console.log("Current signer address:", signerAddress);

        const marketplaceContract = new ethers.Contract(
            marketPlace,
            marketPlaceABI,
            currentSigner
        );

        const mockUsd = new ethers.Contract(
            mockUSDAddress,
            mockUSDABI,
            currentSigner
        );

        let listingId = null;
        let listingDetails = null;
        const totalListings = await marketplaceContract.listingId();
        console.log('Total number of listings:', totalListings.toString());
        
        for (let i = totalListings - 1; i >= 0; i--) {
            const listing = await marketplaceContract.listings(i);
            console.log(`Checking listing ${i}:`, {
                tokenId: listing.tokenId.toString(),
                price: ethers.utils.formatUnits(listing.price, 8),
                seller: listing.seller,
                isListed: listing.isListed
            });
            
            if (listing.tokenId.toString() === tokenId && listing.isListed) {
                listingId = i;
                listingDetails = listing;
                
                if (listing.seller.toLowerCase() === signerAddress.toLowerCase()) {
                    throw new Error('Cannot buy your own NFT. Please switch to a different account.');
                }

                console.log('Found matching listing:', {
                    listingId,
                    tokenId: listing.tokenId.toString(),
                    price: ethers.utils.formatUnits(listing.price, 8),
                    seller: listing.seller,
                    buyer: signerAddress
                });
                
                const nftContract = new ethers.Contract(
                    NFTAddress,
                    NFTABI,
                    currentProvider
                );
                const sellerBalance = await nftContract.balanceOf(listing.seller, listing.tokenId);
                console.log('Seller balance:', sellerBalance.toString());
                if (sellerBalance.eq(0)) {
                    throw new Error('Seller no longer has the NFT');
                }
                
                const buyerBalance = await mockUsd.balanceOf(signerAddress);
                console.log('Buyer USDC balance:', ethers.utils.formatUnits(buyerBalance, 8));
                console.log('Required USDC:', ethers.utils.formatUnits(listing.price, 8));
                if (buyerBalance.lt(listing.price)) {
                    throw new Error(`Insufficient USDC balance. You have ${ethers.utils.formatUnits(buyerBalance, 8)} USDC but need ${ethers.utils.formatUnits(listing.price, 8)} USDC`);
                }

                break;
            }
        }

        if (listingId === null || !listingDetails) {
            throw new Error(`NFT with token ID ${tokenId} is not listed for sale`);
        }

        console.log('Approving USDC spend...');
        const approveTx = await mockUsd.approve(marketPlace, ethers.constants.MaxUint256);
        const approveReceipt = await approveTx.wait();
        console.log('Approval confirmed:', approveReceipt.transactionHash);

        console.log('Buying NFT with listing ID:', listingId);
        const buyTx = await marketplaceContract.buyNFTWithUSDC(listingId);
        const buyReceipt = await buyTx.wait();
        console.log('Purchase confirmed:', buyReceipt.transactionHash);

        const soldEvent = buyReceipt.events?.find(
            (event: any) => event.event === 'NFTSold'
        );

        if (!soldEvent) {
            console.log('Warning: NFTSold event not found in transaction receipt');
            console.log('All events:', buyReceipt.events);
        }

        return {
            approvalHash: approveReceipt.transactionHash,
            purchaseHash: buyReceipt.transactionHash,
            seller: soldEvent?.args?.seller,
            buyer: soldEvent?.args?.buyer,
            price: ethers.utils.formatUnits(soldEvent?.args?.price || '0', 8),
            listingId: listingId
        };
    } catch (error) {
        console.error('Error buying NFT:', error);
        throw error;
    }
}

export async function checkBalances() {
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    
    if (!currentSigner) {
        throw new Error('No account selected. Please switch to an account first.');
    }

    const signerAddress = await currentSigner.getAddress();
    console.log('Checking balances for address:', signerAddress);

    const mockUsd = new ethers.Contract(
        mockUSDAddress,
        mockUSDABI,
        provider
    );

    const marketplaceBalance = await mockUsd.balanceOf(marketPlace);
    const marketplaceBalanceFormatted = ethers.utils.formatUnits(marketplaceBalance, 8);
    
    const signerBalance = await mockUsd.balanceOf(signerAddress);
    const signerBalanceFormatted = ethers.utils.formatUnits(signerBalance, 8);

    const ethBalance = await provider.getBalance(signerAddress);
    const ethBalanceFormatted = ethers.utils.formatEther(ethBalance);

    console.log(`Marketplace ${marketPlace} has a balance of: ${marketplaceBalanceFormatted} USDC`);
    console.log(`Account ${signerAddress}:`);
    console.log(`- USDC Balance: ${signerBalanceFormatted} USDC`);
    console.log(`- ETH Balance: ${ethBalanceFormatted} ETH`);

    return {
        marketplaceAddress: marketPlace,
        marketplaceBalance: marketplaceBalanceFormatted,
        accountAddress: signerAddress,
        accountUsdcBalance: signerBalanceFormatted,
        accountEthBalance: ethBalanceFormatted
    };
}

export async function getAvailableAccounts() {
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    try {
        const accounts = await provider.listAccounts();
        const accountsWithBalance = await Promise.all(
            accounts.map(async (address) => {
                const ethBalance = await provider.getBalance(address);
                const mockUsd = new ethers.Contract(mockUSDAddress, mockUSDABI, provider);
                const usdBalance = await mockUsd.balanceOf(address);
                return {
                    address,
                    ethBalance: ethers.utils.formatEther(ethBalance),
                    usdBalance: ethers.utils.formatUnits(usdBalance, 8)
                };
            })
        );
        return accountsWithBalance;
    } catch (error) {
        console.error('Error getting accounts:', error);
        throw error;
    }
}

export async function resellSubscription(tokenId: string, priceInUsdString: string) {
    console.log('Starting to resell subscription with token ID:', tokenId);

    if (!currentSigner) {
        throw new Error('No account selected. Please switch to an account first.');
    }

    try {
        const signerAddress = await currentSigner.getAddress();
        console.log("Current signer address:", signerAddress);

        const nftContractInstance = new ethers.Contract(
            NFTAddress,
            NFTABI,
            currentSigner
        );

        const marketplaceContract = new ethers.Contract(
            marketPlace,
            marketPlaceABI,
            currentSigner
        );

        const balance = await nftContractInstance.balanceOf(signerAddress, tokenId);
        if (balance.eq(0)) {
            throw new Error("You don't own this subscription NFT");
        }

        const expirationTime = await nftContractInstance.expirationTimes(tokenId);
        const currentTime = Math.floor(Date.now() / 1000);
        if (expirationTime.lt(currentTime)) {
            throw new Error("This subscription has expired and cannot be resold");
        }

        const remainingTime = expirationTime.sub(currentTime);
        console.log('Remaining time:', remainingTime.toString(), 'seconds');

        const priceInUsdc = ethers.utils.parseUnits(priceInUsdString, 8);

        console.log('Approving marketplace to manage NFT...');
        const approveTx = await nftContractInstance.setApprovalForAll(marketPlace, true);
        const approveReceipt = await approveTx.wait();
        console.log('Approval confirmed:', approveReceipt.transactionHash);

        console.log('Listing NFT for resale...');
        const listTx = await marketplaceContract.listNFT(tokenId, priceInUsdc);
        const listReceipt = await listTx.wait();
        console.log('Listing confirmed:', listReceipt.transactionHash);

        return {
            approvalHash: approveReceipt.transactionHash,
            listingHash: listReceipt.transactionHash,
            tokenId: tokenId,
            price: priceInUsdString,
            remainingTime: remainingTime.toString(),
            expirationTime: expirationTime.toString()
        };
    } catch (error) {
        console.error('Error in reselling subscription:', error);
        throw error;
    }
}

export async function getNFTOwner(tokenId: string) {
    try {
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        const nftContract = new ethers.Contract(
            NFTAddress,
            NFTABI,
            provider
        );

        const balance = await nftContract.balanceOf(marketPlace, tokenId);
        if (balance.gt(0)) {
            return marketPlace;
        }

        const accounts = await provider.listAccounts();
        for (const account of accounts) {
            const balance = await nftContract.balanceOf(account, tokenId);
            if (balance.gt(0)) {
                return account;
            }
        }

        throw new Error('No owner found for this NFT');
    } catch (error) {
        console.error('Error getting NFT owner:', error);
        throw error;
    }
}

export async function buyListedSubscription(tokenId: string, price: string) {
    console.log('Starting to purchase subscription with token ID:', tokenId);

    if (!currentSigner) {
        throw new Error('No account selected. Please switch to an account first.');
    }

    try {
        const signerAddress = await currentSigner.getAddress();
        console.log("Current signer address:", signerAddress);

        const result = await BuyNft(tokenId);
        console.log('Purchase result:', result);

        if (!result.purchaseHash) {
            throw new Error('Purchase transaction failed');
        }

        return {
            purchaseHash: result.purchaseHash,
            approvalHash: result.approvalHash,
            seller: result.seller,
            buyer: result.buyer,
            price: result.price,
            tokenId: tokenId
        };
    } catch (error) {
        console.error('Error in purchasing subscription:', error);
        throw error;
    }
}