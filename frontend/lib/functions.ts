import { ethers } from "ethers";
import userOnBoardingAbi from "@/constants/user-on-boarding.json";
import { PaymasterMode } from "@biconomy/account";

const userOnboardingAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const userOnBoarding = async (
    name: string | undefined,
    smartAccount: any
) => {
    try {
        const contractAddress = userOnboardingAddress;
        const provider = new ethers.providers.JsonRpcProvider(
            'http://127.0.0.1:8545'
        );
        const contractInstance = new ethers.Contract(
            contractAddress,
            userOnBoardingAbi,
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