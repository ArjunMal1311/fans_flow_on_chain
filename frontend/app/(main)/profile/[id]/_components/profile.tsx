'use client'

import Link from 'next/link';
import useWeb3auth from '@/hooks/useWeb3auth';
import Image from 'next/image';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { ModelData } from '@/utils/model-data';
import { getTestUSDC, BuyNft, getAvailableAccounts, switchSigner } from '@/lib/functions';
import { checkBalances } from '@/lib/functions';

interface ProfileProps {
    model: ModelData;
}

interface SubscriptionOption {
    id: string;
    modelId: string;
    price: string;
    duration: number;
    description: string;
    createdAt: string;
}

interface BuySuccessData {
    seller: string;
    buyer: string;
    price: string;
    hash: string;
}

interface Account {
    address: string;
    ethBalance: string;
    usdBalance: string;
}

interface BalanceInfo {
    marketplaceBalance: string;
    accountUsdcBalance: string;
    accountEthBalance: string;
}

export default function Profile({ model }: ProfileProps) {
    const { login, loggedIn, logout, name, provider, email, smartAccount, smartAccountAddress } = useWeb3auth();
    const [subscriptionOptions, setSubscriptionOptions] = useState<SubscriptionOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gettingUSDC, setGettingUSDC] = useState(false);
    const [usdcMessage, setUsdcMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [testAddress, setTestAddress] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const [tokenId, setTokenId] = useState('');
    const [isBuying, setIsBuying] = useState(false);
    const [buySuccess, setBuySuccess] = useState<BuySuccessData | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [switchingAccount, setSwitchingAccount] = useState(false);
    const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);

    useEffect(() => {
        const fetchSubscriptionOptions = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/subscription-options/${model.model_id}`);
                if (response.data.success) {
                    setSubscriptionOptions(response.data.data || []);
                }
            } catch (err) {
                console.error('Error fetching subscription options:', err);
                setError('Failed to load subscription options');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptionOptions();

        console.log("EMAIL", email);
        console.log("NAME", name);
    }, [model.model_id]);

    useEffect(() => {
        fetchAccounts();
        fetchBalances();
    }, []);

    const fetchAccounts = async () => {
        try {
            const availableAccounts = await getAvailableAccounts();
            setAccounts(availableAccounts);
            if (availableAccounts.length > 0) {
                setSelectedAccount(availableAccounts[0]);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleAccountSwitch = async (accountIndex: number) => {
        try {
            setSwitchingAccount(true);
            const newAccount = accounts[accountIndex];
            await switchSigner(accountIndex);
            setSelectedAccount(newAccount);

            setError(null);
            setBuySuccess(null);
            setUsdcMessage(null);
        } catch (error) {
            console.error('Error switching account:', error);
            setError('Failed to switch account');
        } finally {
            setSwitchingAccount(false);
        }
    };

    const handleGetTestUSDC = async () => {
        if (!testAddress) {
            setUsdcMessage({
                type: 'error',
                text: 'Please enter a test account address'
            });
            return;
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(testAddress)) {
            setUsdcMessage({
                type: 'error',
                text: 'Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)'
            });
            return;
        }

        setGettingUSDC(true);
        setUsdcMessage(null);
        try {
            const result = await getTestUSDC(testAddress);
            setUsdcMessage({
                type: 'success',
                text: `Successfully got test USDC! Previous balance: ${result.previousBalance} USDC, New balance: ${result.newBalance} USDC`
            });
            setTestAddress('');
        } catch (err: any) {
            console.error('Error getting test USDC:', err);
            setUsdcMessage({
                type: 'error',
                text: err.message || 'Failed to get test USDC. Please make sure you are using a test account address.'
            });
        } finally {
            setGettingUSDC(false);
        }
    };

    const handleLogin = async () => {
        try {
            setIsAuthenticating(true);
            setError(null);
            await login(0);
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Failed to login. Please try again.');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const buyNFTFunction = async () => {
        if (!loggedIn) {
            setError("Please login first to buy NFTs");
            return;
        }

        if (!tokenId) {
            setError("Please enter a token ID to buy");
            return;
        }

        try {
            setError(null);
            setBuySuccess(null);
            setIsBuying(true);
            const response = await BuyNft(tokenId);
            console.log("Buy response:", response);
            setBuySuccess({
                seller: response.seller,
                buyer: response.buyer,
                price: response.price,
                hash: response.purchaseHash
            });

            const userResponse = await axios.get(`http://localhost:8080/user-info?wallet_address=${smartAccountAddress}`);
            if (!userResponse.data.success) {
                throw new Error('Failed to fetch user data');
            }
            const userData = userResponse.data.data.user;

            const modelResponse = await axios.get(`http://localhost:8080/model/${model.slug}`);
            if (!modelResponse.data.success) {
                throw new Error('Failed to fetch model data');
            }
            const modelData = modelResponse.data.data;

            const res = await axios.post('http://localhost:8080/purchase-subscription', {
                email: email,
                modelId: modelData.model_id,
                tokenId: tokenId,
                userId: userData.id,
                isListed: true,
                listingId: response.listingId,
                price: response.price
            });

            console.log(res)

            setTokenId('');
        } catch (error: any) {
            console.error("Error buying NFT:", error);
            setError(error.message || "Error buying NFT");
        } finally {
            setIsBuying(false);
        }
    };

    const fetchBalances = async () => {
        setIsLoadingBalances(true);
        setBalanceError(null);
        try {
            const balances = await checkBalances();
            setBalanceInfo({
                marketplaceBalance: balances.marketplaceBalance,
                accountUsdcBalance: balances.accountUsdcBalance,
                accountEthBalance: balances.accountEthBalance
            });
        } catch (error: any) {
            console.error('Error fetching balances:', error);
            setBalanceError(error.message || 'Failed to fetch balances');
        } finally {
            setIsLoadingBalances(false);
        }
    };

    const renderBalanceInfo = () => {
        if (isLoadingBalances) {
            return (
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>
            );
        }

        if (balanceError) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-600 text-sm">{balanceError}</p>
                    <button
                        onClick={fetchBalances}
                        className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (!balanceInfo) return null;

        return (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Wallet Balances</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Your USDC Balance:</span>
                        <span className="font-medium">{balanceInfo.accountUsdcBalance} USDC</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Your ETH Balance:</span>
                        <span className="font-medium">{balanceInfo.accountEthBalance} ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Marketplace USDC Balance:</span>
                        <span className="font-medium">{balanceInfo.marketplaceBalance} USDC</span>
                    </div>
                </div>
                <button
                    onClick={fetchBalances}
                    className="mt-4 text-pink-600 hover:text-pink-700 text-sm font-medium flex items-center"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Balances
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="relative h-[400px]">
                <Image
                    src={model.image.src}
                    alt={model.name}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* Profile Info */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {renderBalanceInfo()}
                <div className="relative -mt-32">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Avatar */}
                            <div className="relative h-48 w-48 ring-4 ring-pink-400 ring-offset-4 rounded-full overflow-hidden mx-auto md:mx-0">
                                <Image
                                    src={model.icon.src}
                                    alt={`${model.name}'s avatar`}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                {/* Add login button at the top */}
                                {!loggedIn && (
                                    <div className="mb-6">
                                        <button
                                            onClick={handleLogin}
                                            disabled={isAuthenticating}
                                            className="bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isAuthenticating ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Connecting...
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                                    </svg>
                                                    Connect Wallet
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 mb-4">
                                    <h1 className="text-4xl font-bold text-gray-800">{model.name}</h1>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-pink-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                    </svg>
                                </div>

                                <div className="flex items-center gap-4 text-gray-600 mb-6">
                                    <span className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-pink-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                        </svg>
                                        {model.location}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-pink-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                        {model.views}M views
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#F1673D]" viewBox="0 0 29 34" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1.59901 17.6116C2.25123 18.2415 2.95961 18.8155 3.71604 19.327C3.91455 19.4635 4.17672 19.4797 4.39181 19.3687C4.60689 19.2577 4.73736 19.0388 4.72808 18.8046C4.55306 14.947 4.90017 3.02643 15.5352 0.0234903C15.743 -0.0349206 15.9674 0.0173659 16.1242 0.160692C16.281 0.304018 16.3463 0.51666 16.2956 0.718671C13.5438 11.8994 20.4363 15.3139 23.5687 10.0369C23.6699 9.86162 23.8595 9.75006 24.0682 9.7429C24.2769 9.73575 24.4742 9.83404 24.5883 10.0019C27.3254 14.0605 26.6031 17.6919 25.8687 19.5874C25.7473 19.9107 25.8467 20.2724 26.1183 20.4963C26.3899 20.7203 26.7775 20.7599 27.0922 20.596C27.5548 20.352 27.9806 20.0486 28.358 19.6943C28.4524 19.6078 28.5914 19.5834 28.7116 19.6322C28.8319 19.6809 28.9104 19.7936 28.9115 19.9189V19.927C28.9145 27.4061 22.7392 33.5412 14.9505 33.7972C7.16182 34.0532 0.563646 28.3379 0.0334209 20.8761C-0.0320938 19.9482 -0.00123588 19.0163 0.125539 18.0942C0.167262 17.779 0.39238 17.5142 0.705695 17.4117C1.01901 17.3092 1.3658 17.3869 1.59942 17.612L1.59901 17.6116Z" />
                                        </svg>
                                        {model.tease}K
                                    </span>
                                </div>

                                <p className="text-gray-600 mb-8">{model.about_me}</p>

                                <div className="flex flex-wrap gap-4">
                                    {/* Account Switcher */}
                                    <div className="w-full p-6 bg-white rounded-xl shadow-lg border border-purple-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-semibold text-gray-800">Test Account Switcher</h3>
                                            {switchingAccount && (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <select
                                                className="w-full rounded-lg border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                                                onChange={(e) => handleAccountSwitch(parseInt(e.target.value))}
                                                disabled={switchingAccount}
                                                value={accounts.findIndex(acc => acc.address === selectedAccount?.address)}
                                            >
                                                {accounts.map((account, index) => (
                                                    <option key={account.address} value={index}>
                                                        Account {index + 1}: {account.address.slice(0, 6)}...{account.address.slice(-4)}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedAccount && (
                                                <div className="bg-purple-50 rounded-lg p-4 text-sm">
                                                    <p className="font-semibold text-purple-700 mb-2">Selected Account Details:</p>
                                                    <div className="space-y-1 text-purple-600">
                                                        <p>Address: {selectedAccount.address}</p>
                                                        <p>ETH Balance: {selectedAccount.ethBalance} ETH</p>
                                                        <p>USDC Balance: {selectedAccount.usdBalance} USDC</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* NFT Buying Section */}
                                    <div className="w-full p-6 bg-white rounded-xl shadow-lg border border-pink-100">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Buy NFT</h3>
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                value={tokenId}
                                                onChange={(e) => setTokenId(e.target.value)}
                                                placeholder="Enter NFT Token ID"
                                                className="flex-1 rounded-lg border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                            />
                                            <button
                                                onClick={buyNFTFunction}
                                                disabled={isBuying || !tokenId || !selectedAccount}
                                                className="bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {isBuying ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                        Buying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                                        </svg>
                                                        Buy NFT
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {error && (
                                            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                                                {error}
                                            </div>
                                        )}

                                        {buySuccess && (
                                            <div className="mt-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl">
                                                <h4 className="font-semibold mb-2">Purchase Successful!</h4>
                                                <div className="space-y-1 text-sm">
                                                    <p>Price: {buySuccess.price} USDC</p>
                                                    <p>Seller: {buySuccess.seller.slice(0, 6)}...{buySuccess.seller.slice(-4)}</p>
                                                    <p>Buyer: {buySuccess.buyer.slice(0, 6)}...{buySuccess.buyer.slice(-4)}</p>
                                                    <p>Transaction: {buySuccess.hash.slice(0, 6)}...{buySuccess.hash.slice(-4)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button className="bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-pink-200">
                                        Subscribe for ${model.value}
                                    </button>
                                    <button className="bg-white text-pink-500 border-2 border-pink-400 hover:bg-pink-50 px-8 py-3 rounded-full font-medium transition-all duration-200">
                                        Message
                                    </button>
                                    <div className="flex-1 min-w-[300px] flex gap-2">
                                        <input
                                            type="text"
                                            value={testAddress}
                                            onChange={(e) => setTestAddress(e.target.value)}
                                            placeholder="Enter test account address"
                                            className="flex-1 rounded-full border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                        />
                                        <button
                                            onClick={handleGetTestUSDC}
                                            disabled={gettingUSDC}
                                            className="bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                        >
                                            {gettingUSDC ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Getting USDC...
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                    </svg>
                                                    Get USDC
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <Link
                                        href="/test-accounts"
                                        className="text-sm text-purple-500 hover:text-purple-600 transition-colors"
                                        target="_blank"
                                    >
                                        View test accounts →
                                    </Link>
                                </div>
                                {usdcMessage && (
                                    <div className={`mt-4 px-4 py-3 rounded-xl ${usdcMessage.type === 'success'
                                        ? 'bg-green-50 border border-green-200 text-green-600'
                                        : 'bg-red-50 border border-red-200 text-red-600'
                                        }`}>
                                        {usdcMessage.text}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Posts</h3>
                        <p className="text-3xl font-bold text-pink-500">{model.posts}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Total Views</h3>
                        <p className="text-3xl font-bold text-pink-500">{model.views}M</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Tease</h3>
                        <p className="text-3xl font-bold text-pink-500">{model.tease}K</p>
                    </div>
                </div>

                {/* Subscription Options */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Subscription Options</h2>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    ) : subscriptionOptions.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-8 rounded-xl text-center">
                            No subscription options available yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {subscriptionOptions.map((option) => (
                                <div
                                    key={option.id}
                                    className="bg-white rounded-xl shadow-lg border border-pink-100 p-6 hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold text-gray-800">${option.price}</h3>
                                        <span className="text-sm text-gray-600">{option.duration} days</span>
                                    </div>
                                    <p className="text-gray-600 mb-6">{option.description}</p>
                                    <button className="w-full bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-pink-200">
                                        Subscribe Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
