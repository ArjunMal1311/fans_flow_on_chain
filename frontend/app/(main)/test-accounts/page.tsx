'use client';

import mockUSDABI from "@/abis/MockUSD.json";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const mockUSDAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

interface TestAccount {
    address: string;
    privateKey: string;
}

interface AccountWithBalance extends TestAccount {
    usdcBalance?: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
    {
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    },
    {
        address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    },
    {
        address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
    },
    {
        address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
    },
    {
        address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
    }
];

export default function TestAccountsPage() {
    const [accounts, setAccounts] = useState<AccountWithBalance[]>(TEST_ACCOUNTS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUSDCBalances = async () => {
            try {
                const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
                const mockUsd = new ethers.Contract(mockUSDAddress, mockUSDABI, provider);

                const accountsWithBalances = await Promise.all(
                    TEST_ACCOUNTS.map(async (account) => {
                        const balance = await mockUsd.balanceOf(account.address);
                        return {
                            ...account,
                            usdcBalance: ethers.utils.formatUnits(balance, 8)
                        };
                    })
                );

                setAccounts(accountsWithBalances);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching USDC balances:', err);
                setError('Failed to fetch USDC balances');
                setLoading(false);
            }
        };

        fetchUSDCBalances();
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <div className="relative overflow-hidden bg-gradient-to-r from-pink-50 to-white border-b border-pink-100">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="relative">
                        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600 mb-2 animate-gradient">
                            Test Accounts
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl">
                            Use these Hardhat test accounts for local development. Each account comes with 10,000 ETH.
                            Copy an address to get test USDC.
                        </p>
                        <div className="absolute -top-24 -right-20 w-64 h-64 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full opacity-20 blur-3xl" />
                        <div className="absolute -bottom-32 -right-20 w-64 h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-8 px-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-center">
                        {error}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {accounts.map((account, index) => (
                            <div key={account.address} className="bg-white rounded-xl shadow-lg border border-pink-100 p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm font-medium">
                                        Account #{index}
                                    </span>
                                    <div className="flex gap-2">
                                        <span className="text-purple-500">
                                            {account.usdcBalance ?
                                                `${Number(account.usdcBalance).toLocaleString()} USDC` :
                                                '0 USDC'
                                            }
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                                        <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm break-all">
                                            {account.address}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Private Key</label>
                                        <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm break-all">
                                            {account.privateKey}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 