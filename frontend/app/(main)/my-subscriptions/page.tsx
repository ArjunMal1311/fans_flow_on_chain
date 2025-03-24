'use client'

import useWeb3auth from '@/hooks/useWeb3auth';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { resellSubscription, getAvailableAccounts, switchSigner, getNFTOwner } from '@/lib/functions';

interface IPFSMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
}

interface SubscriptionDetails {
    modelId: string;
    modelName: string;
    ipfsUrl: string;
    tokenId: string;
    isListed: boolean;
    price: string;
    imageUrl?: string;
    owner?: string;
}

interface UserInfoResponse {
    success: boolean;
    message: string;
    data: {
        user: {
            id: string;
            name: string;
            email: string;
            wallet_address: string;
        };
        subscriptions: SubscriptionDetails[];
    };
}

interface ResellModalProps {
    onClose: () => void;
    onSubmit: (price: string) => void;
    isLoading: boolean;
}

interface Account {
    address: string;
    ethBalance: string;
    usdBalance: string;
}

const ResellModal: React.FC<ResellModalProps> = ({ onClose, onSubmit, isLoading }) => {
    const [price, setPrice] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!price || isNaN(Number(price)) || Number(price) <= 0) {
            setError('Please enter a valid price');
            return;
        }
        onSubmit(price);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Resell Subscription</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price in USDC
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={price}
                                onChange={(e) => {
                                    setPrice(e.target.value);
                                    setError('');
                                }}
                                className="w-full rounded-lg border-gray-300 focus:border-pink-300 focus:ring-pink-200 pl-8"
                                placeholder="0.00"
                                required
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500">$</span>
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            {isLoading ? 'Processing...' : 'List for Sale'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function MySubscriptions() {
    const { login, loggedIn, smartAccountAddress } = useWeb3auth();
    const [subscriptions, setSubscriptions] = useState<SubscriptionDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionDetails | null>(null);
    const [isReselling, setIsReselling] = useState(false);
    const [resellSuccess, setResellSuccess] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [switchingAccount, setSwitchingAccount] = useState(false);

    const fetchIPFSMetadata = async (subscription: SubscriptionDetails) => {
        try {
            const response = await axios.get<IPFSMetadata>(subscription.ipfsUrl);
            return {
                ...subscription,
                imageUrl: response.data.image
            };
        } catch (err) {
            console.error('Error fetching IPFS metadata:', err);
            return subscription;
        }
    };

    const fetchOwnerForSubscription = async (subscription: SubscriptionDetails) => {
        try {
            const owner = await getNFTOwner(subscription.tokenId);
            return {
                ...subscription,
                owner
            };
        } catch (err) {
            console.error('Error fetching owner:', err);
            return subscription;
        }
    };

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const response = await axios.get<UserInfoResponse>(`http://localhost:8080/user-info?wallet_address=${smartAccountAddress}`);
            if (response.data.success) {
                const subscriptionsData = response.data.data.subscriptions || [];
                const subscriptionsWithMetadata = await Promise.all(
                    subscriptionsData.map(async (subscription) => {
                        const withMetadata = await fetchIPFSMetadata(subscription);
                        return fetchOwnerForSubscription(withMetadata);
                    })
                );
                setSubscriptions(subscriptionsWithMetadata);
            } else {
                throw new Error(response.data.message || 'Failed to fetch subscriptions');
            }
        } catch (err: any) {
            console.error('Error fetching subscriptions:', err);
            setError(err.message || 'Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const availableAccounts = await getAvailableAccounts();
            setAccounts(availableAccounts);
            if (availableAccounts.length > 0) {
                setSelectedAccount(availableAccounts[0]);
                await handleAccountSwitch(0);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setError('Failed to fetch accounts');
        }
    };

    const handleAccountSwitch = async (accountIndex: number) => {
        try {
            setSwitchingAccount(true);
            const newAccount = accounts[accountIndex];
            await switchSigner(accountIndex);
            setSelectedAccount(newAccount);

            setError(null);
            setResellSuccess(null);
        } catch (error: any) {
            console.error('Error switching account:', error);
            setError('Failed to switch account');
        } finally {
            setSwitchingAccount(false);
        }
    };

    useEffect(() => {
        if (loggedIn) {
            fetchAccounts();
            fetchSubscriptions();
        }
    }, [loggedIn, smartAccountAddress]);

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

    const handleResell = async (price: string) => {
        if (!selectedSubscription) return;
        if (!selectedAccount) {
            setError('Please select an account first');
            return;
        }

        try {
            setIsReselling(true);
            setError(null);

            const result = await resellSubscription(selectedSubscription.tokenId, price);
            console.log('Resell result:', result);

            console.log("Selected Subscription:", selectedSubscription);

            const updateResponse = await axios.patch('http://localhost:8080/update-subscription', {
                TokenId: selectedSubscription.tokenId,
                WalletAddress: smartAccountAddress,
                IsListed: true,
                Price: price
            });

            console.log('Update response:', updateResponse.data);

            if (!updateResponse.data.success) {
                throw new Error('Failed to update subscription status in database');
            }

            setSubscriptions(subs =>
                subs.map(sub =>
                    sub.tokenId === selectedSubscription.tokenId
                        ? { ...sub, isListed: true, price }
                        : sub
                )
            );

            setResellSuccess(`Successfully listed subscription for ${price} USDC`);
            setSelectedSubscription(null);
        } catch (err: any) {
            console.error('Error reselling subscription:', err);
            setError(err.message || 'Failed to resell subscription');

            if (err.message === 'Failed to update subscription status in database') {
                setError('Successfully listed on blockchain, but failed to update status. Please try refreshing the page.');
            }
        } finally {
            setIsReselling(false);
        }
    };

    if (!loggedIn) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Connect Your Wallet</h1>
                    <p className="text-gray-600 mb-8">Please connect your wallet to view your subscriptions</p>
                    <button
                        onClick={handleLogin}
                        disabled={isAuthenticating}
                        className="bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
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
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {selectedSubscription && (
                <ResellModal
                    onClose={() => setSelectedSubscription(null)}
                    onSubmit={handleResell}
                    isLoading={isReselling}
                />
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-pink-50 to-white border-b border-pink-100">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600 mb-2">
                        My Subscriptions
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Manage your active subscriptions
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Account Switcher */}
                <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-purple-100">
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

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {resellSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-6 py-4 rounded-xl mb-6">
                        {resellSuccess}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    </div>
                ) : subscriptions.length === 0 ? (
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">No Subscriptions Found</h2>
                        <p className="text-gray-600 mb-8">You haven't subscribed to any creators yet.</p>
                        <Link
                            href="/"
                            className="inline-block bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-200"
                        >
                            Explore Creators
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subscriptions.map((subscription) => (
                            <div
                                key={subscription.tokenId}
                                className="bg-white rounded-xl shadow-lg border border-pink-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="relative h-48">
                                    <Image
                                        src={subscription.imageUrl || '/placeholder-image.jpg'}
                                        alt={subscription.modelName}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-800">
                                                {subscription.modelName}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Token ID: {subscription.tokenId}
                                            </p>
                                            {subscription.owner && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Owner: {subscription.owner.slice(0, 6)}...{subscription.owner.slice(-4)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                                        <span>Price: ${subscription.price} USDC</span>
                                        <span className={subscription.isListed ? 'text-orange-500' : 'text-green-500'}>
                                            {subscription.isListed ? 'Listed for Sale' : 'Active'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/profile/${subscription.modelId}`}
                                            className="flex-1 text-center bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                                        >
                                            View Creator
                                        </Link>
                                        {!subscription.isListed && (
                                            <button
                                                onClick={() => setSelectedSubscription(subscription)}
                                                className="flex-1 border border-pink-400 text-pink-500 hover:bg-pink-50 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                                            >
                                                Resell
                                            </button>
                                        )}
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