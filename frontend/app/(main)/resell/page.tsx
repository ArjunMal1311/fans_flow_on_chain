'use client'

import useWeb3auth from '@/hooks/useWeb3auth';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAvailableAccounts, switchSigner, buyListedSubscription } from '@/lib/functions';

interface ListedSubscriptionResponse {
    id: string;
    token_id: string;
    price: string;
    is_listed: boolean;
    model: {
        name: string;
        model_id: string;
        ipfs_url: string;
    };
}

interface ListedSubscription {
    id: string;
    tokenId: string;
    price: string;
    isListed: boolean;
    model: {
        name: string;
        modelId: string;
        ipfsUrl: string;
    };
    imageUrl?: string;
    owner?: string;
    metadata?: IPFSMetadata;
}

interface IPFSMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
}

interface Account {
    address: string;
    ethBalance: string;
    usdBalance: string;
}

export default function ResellPage() {
    const { login, loggedIn, smartAccountAddress } = useWeb3auth();
    const [listedSubscriptions, setListedSubscriptions] = useState<ListedSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [switchingAccount, setSwitchingAccount] = useState(false);

    const fetchIPFSMetadata = async (subscription: ListedSubscription) => {
        try {
            if (!subscription.model.ipfsUrl) {
                console.warn('No IPFS URL provided for subscription:', subscription);
                return subscription;
            }

            let metadataUrl = subscription.model.ipfsUrl;
            if (metadataUrl.startsWith('ipfs://')) {
                metadataUrl = metadataUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            console.log('Fetching IPFS metadata from:', metadataUrl);

            const response = await axios.get<IPFSMetadata>(metadataUrl);
            console.log('IPFS metadata response:', response);

            if (!response.data) {
                throw new Error('No data received from IPFS');
            }

            console.log('IPFS metadata received:', response.data);

            let imageUrl = response.data.image;
            if (imageUrl.startsWith('ipfs://')) {
                imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            console.log('Transformed image URL:', imageUrl);

            try {
                await axios.head(imageUrl);
                console.log('Image URL is accessible:', imageUrl);
            } catch (error) {
                console.warn('Image URL is not accessible, using fallback:', error);
                imageUrl = '/placeholder-image.jpg';
            }

            return {
                ...subscription,
                imageUrl,
                metadata: response.data
            };
        } catch (err) {
            console.error('Error fetching IPFS metadata for subscription:', subscription.tokenId, err);
            return {
                ...subscription,
                imageUrl: '/placeholder-image.jpg'
            };
        }
    };

    const fetchListedSubscriptions = async () => {
        try {
            setLoading(true);
            const response = await axios.get<{ success: boolean; data: ListedSubscriptionResponse[]; message?: string }>('http://localhost:8080/listed-subscriptions');
            console.log('Listed subscriptions response:', response.data);

            if (response.data.success) {
                const subscriptionsData = response.data.data || [];
                console.log('Raw subscriptions data:', subscriptionsData);

                const transformedData: ListedSubscription[] = subscriptionsData.map((sub) => ({
                    id: sub.id,
                    tokenId: sub.token_id,
                    price: sub.price,
                    isListed: sub.is_listed,
                    model: {
                        name: sub.model.name,
                        modelId: sub.model.model_id,
                        ipfsUrl: sub.model.ipfs_url
                    }
                }));

                console.log('Transformed data:', transformedData);

                const subscriptionsWithMetadata = await Promise.all(
                    transformedData.map(async (subscription: ListedSubscription) => {
                        const withMetadata = await fetchIPFSMetadata(subscription);
                        console.log(`Metadata for subscription ${subscription.tokenId}:`, withMetadata);
                        return withMetadata;
                    })
                );

                console.log('Final subscriptions with metadata:', subscriptionsWithMetadata);
                setListedSubscriptions(subscriptionsWithMetadata);
            } else {
                throw new Error(response.data.message || 'Failed to fetch listed subscriptions');
            }
        } catch (err: any) {
            console.error('Error fetching listed subscriptions:', err);
            setError(err.message || 'Failed to load listed subscriptions');
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
            setPurchaseSuccess(null);
        } catch (error: any) {
            console.error('Error switching account:', error);
            setError('Failed to switch account');
        } finally {
            setSwitchingAccount(false);
        }
    };

    const handlePurchase = async (subscription: ListedSubscription) => {
        if (!selectedAccount) {
            setError('Please select an account first');
            return;
        }

        try {
            setError(null);
            setPurchaseSuccess(null);

            console.log('Purchasing subscription:', subscription);
            const result = await buyListedSubscription(subscription.tokenId, subscription.price);
            console.log('Purchase result:', result);

            const updateResponse = await axios.patch('http://localhost:8080/update-subscription', {
                TokenId: subscription.tokenId,
                WalletAddress: smartAccountAddress,
                IsListed: false,
                Price: result.price
            });

            console.log('Update response:', updateResponse.data);

            if (!updateResponse.data.success) {
                throw new Error('Failed to update subscription status in database');
            }

            setListedSubscriptions(subs =>
                subs.filter(sub => sub.tokenId !== subscription.tokenId)
            );

            setPurchaseSuccess(
                `Successfully purchased subscription for ${result.price} USDC\n` +
                `Transaction Hash: ${result.purchaseHash.slice(0, 6)}...${result.purchaseHash.slice(-4)}`
            );
        } catch (err: any) {
            console.error('Error purchasing subscription:', err);
            setError(err.message || 'Failed to purchase subscription');

            if (err.message === 'Failed to update subscription status in database') {
                setError(
                    'Successfully purchased on blockchain, but failed to update status. ' +
                    'Please try refreshing the page.'
                );
            }
        }
    };

    useEffect(() => {
        if (loggedIn) {
            fetchAccounts();
            fetchListedSubscriptions();
        }
    }, [loggedIn]);

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

    if (!loggedIn) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Connect Your Wallet</h1>
                    <p className="text-gray-600 mb-8">Please connect your wallet to view listed subscriptions</p>
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
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-50 to-white border-b border-pink-100">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600 mb-2">
                        Listed Subscriptions
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Browse and purchase available subscriptions
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

                {purchaseSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-6 py-4 rounded-xl mb-6">
                        {purchaseSuccess}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    </div>
                ) : listedSubscriptions.length === 0 ? (
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">No Listed Subscriptions</h2>
                        <p className="text-gray-600 mb-8">There are currently no subscriptions listed for sale.</p>
                        <Link
                            href="/my-subscriptions"
                            className="inline-block bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-200"
                        >
                            List Your Subscription
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listedSubscriptions.map((subscription) => (
                            <div
                                key={subscription.id}
                                className="bg-white rounded-xl shadow-lg border border-pink-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="relative h-48 bg-gray-100">
                                    {subscription.imageUrl ? (
                                        <Image
                                            src={subscription.imageUrl}
                                            alt={subscription.model.name}
                                            fill
                                            className="object-cover"
                                            loading="lazy"
                                            onError={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                img.src = '/placeholder-image.jpg';
                                            }}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-800">
                                                {subscription.model.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Token ID: {subscription.tokenId}
                                            </p>
                                            {subscription.owner && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Seller: {subscription.owner.slice(0, 6)}...{subscription.owner.slice(-4)}
                                                </p>
                                            )}
                                            {subscription.metadata?.description && (
                                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                    {subscription.metadata.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                                        <span>Price: ${subscription.price} USDC</span>
                                        <span className="text-orange-500">Listed for Sale</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/profile/${subscription.model.modelId}`}
                                            className="flex-1 text-center bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                                        >
                                            View Creator
                                        </Link>
                                        <button
                                            onClick={() => handlePurchase(subscription)}
                                            className="flex-1 border border-pink-400 text-pink-500 hover:bg-pink-50 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                                        >
                                            Purchase
                                        </button>
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