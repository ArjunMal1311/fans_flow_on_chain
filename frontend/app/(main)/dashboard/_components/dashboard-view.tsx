import axios from 'axios';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ModelData } from '@/utils/model-data';
import { listNft, mintingNft, checkBalances, switchSigner } from '@/lib/functions';
import { ethers } from 'ethers';

interface DashboardViewProps {
    model: ModelData;
}

interface SubscriptionFormData {
    price: string;
    duration: string;
    description: string;
}

interface SubscriptionOption {
    id: string;
    modelId: string;
    price: string;
    duration: number;
    description: string;
    createdAt: string;
}

interface SubscriptionIdInputProps {
    onSubmit: (subscriptionId: number) => void;
    onCancel: () => void;
    loading: boolean;
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

interface BalanceInfo {
    marketplaceBalance: string;
    accountUsdcBalance: string;
    accountEthBalance: string;
}

const DURATION_OPTIONS = [
    { value: "30", label: "30 days", recommendedPrice: "9.99" },
    { value: "90", label: "90 days", recommendedPrice: "24.99" },
    { value: "180", label: "180 days", recommendedPrice: "44.99" },
    { value: "365", label: "1 year", recommendedPrice: "79.99" }
];

const SubscriptionIdInput: React.FC<SubscriptionIdInputProps> = ({ onSubmit, onCancel, loading }) => {
    const [subscriptionId, setSubscriptionId] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const id = parseInt(subscriptionId);
        if (isNaN(id) || id <= 0) {
            setError('Please enter a valid positive number');
            return;
        }
        onSubmit(id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Enter Subscription ID</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subscription ID
                        </label>
                        <input
                            type="number"
                            value={subscriptionId}
                            onChange={(e) => {
                                setSubscriptionId(e.target.value);
                                setError('');
                            }}
                            className="w-full rounded-lg border-gray-300 focus:border-pink-300 focus:ring-pink-200"
                            placeholder="Enter a unique subscription ID"
                            required
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            {loading ? 'Processing...' : 'Confirm'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
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

export default function DashboardView({ model }: DashboardViewProps) {
    const [isAddingSubscription, setIsAddingSubscription] = useState(false);
    const [showSubscriptionIdInput, setShowSubscriptionIdInput] = useState(false);
    const [selectedOption, setSelectedOption] = useState<SubscriptionOption | null>(null);
    const [formData, setFormData] = useState<SubscriptionFormData>({
        price: '',
        duration: '30',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [subscriptionOptions, setSubscriptionOptions] = useState<SubscriptionOption[]>([]);
    const [fetchingOptions, setFetchingOptions] = useState(true);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);
    const [addressInput, setAddressInput] = useState('');
    const [currentAddress, setCurrentAddress] = useState<string | null>(null);

    useEffect(() => {
        fetchSubscriptionOptions();
        fetchIPFSMetadata();
    }, [model.model_id, model.ipfs_url]);

    const fetchIPFSMetadata = async () => {
        if (!model.ipfs_url) return;

        try {
            const response = await axios.get(model.ipfs_url);
            const metadata: IPFSMetadata = response.data;
            if (metadata.image) {
                setProfileImage(metadata.image);
            }
        } catch (err) {
            console.error('Error fetching IPFS metadata:', err);
        }
    };

    const fetchSubscriptionOptions = async () => {
        setFetchingOptions(true);
        try {
            const response = await axios.get(`http://localhost:8080/subscription-options/${model.model_id}`);
            if (response.data.success) {
                setSubscriptionOptions(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching subscription options:', err);
            setSubscriptionOptions([]);
        } finally {
            setFetchingOptions(false);
        }
    };

    const fetchBalances = async () => {
        if (!addressInput) {
            setBalanceError('Please enter an address');
            return;
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(addressInput)) {
            setBalanceError('Please enter a valid Ethereum address');
            return;
        }

        setIsLoadingBalances(true);
        setBalanceError(null);
        try {
            const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
            const accounts = await provider.listAccounts();

            const accountIndex = accounts.findIndex(
                account => account.toLowerCase() === addressInput.toLowerCase()
            );

            if (accountIndex === -1) {
                throw new Error('Address not found in available accounts. Please use a valid Hardhat test account.');
            }

            await switchSigner(accountIndex);

            const balances = await checkBalances();
            setBalanceInfo({
                marketplaceBalance: balances.marketplaceBalance,
                accountUsdcBalance: balances.accountUsdcBalance,
                accountEthBalance: balances.accountEthBalance
            });
            setCurrentAddress(addressInput);

        } catch (error: any) {
            console.error('Error fetching balances:', error);
            setBalanceError(error.message || 'Failed to fetch balances');
        } finally {
            setIsLoadingBalances(false);
        }
    };

    const handleListNFT = (option: SubscriptionOption) => {
        setSelectedOption(option);
        setShowSubscriptionIdInput(true);
    };

    const listNFTFunction = async (subscriptionOption: SubscriptionOption, customSubscriptionId: number) => {
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        const signer = provider.getSigner();
        const signerAddress = await signer.getAddress();

        try {
            setError(null);
            setLoading(true);
            const modelId = parseInt(subscriptionOption.modelId);
            const durationInSeconds = subscriptionOption.duration * 24 * 60 * 60;

            console.log(`Creating NFT for Model ${modelId} with Subscription ID ${customSubscriptionId}`);

            const response = await mintingNft({
                modelId,
                subscriptionId: customSubscriptionId,
                duration: durationInSeconds,
                fromAddress: signerAddress
            });

            console.log("Minting response:", response);

            if (response.tokenId) {
                const listResponse = await listNft(
                    response.tokenId,
                    subscriptionOption.price
                );
                console.log("Listing response:", listResponse);
                setSuccess(`NFT minted with subscription ID ${customSubscriptionId} and listed successfully!`);
            } else {
                throw new Error("No token ID received from minting");
            }
        } catch (error: any) {
            console.error("Error in listing NFT:", error);
            setError(error.message || "Error listing NFT");
        } finally {
            setLoading(false);
            setShowSubscriptionIdInput(false);
            setSelectedOption(null);
        }
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
            setFormData({ ...formData, price: value });
        }
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const duration = e.target.value;
        const option = DURATION_OPTIONS.find(opt => opt.value === duration);
        setFormData({
            ...formData,
            duration,
            price: option ? option.recommendedPrice : formData.price
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post('http://localhost:8080/subscription-options', {
                modelId: model.model_id,
                price: formData.price,
                duration: parseInt(formData.duration),
                description: formData.description
            });

            if (response.data.success) {
                setSuccess('Subscription option added successfully!');
                setFormData({ price: '', duration: '30', description: '' });
                setIsAddingSubscription(false);
                fetchSubscriptionOptions();
            } else {
                setError(response.data.error || 'Failed to add subscription option');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add subscription option');
        } finally {
            setLoading(false);
        }
    };

    const renderBalanceInfo = () => {
        return (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Check Wallet Balances</h3>
                <div className="flex gap-4 mb-6">
                    <input
                        type="text"
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        placeholder="Enter wallet address (0x...)"
                        className="flex-1 rounded-lg border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                    />
                    <button
                        onClick={fetchBalances}
                        disabled={isLoadingBalances}
                        className="bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                    >
                        {isLoadingBalances ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Checking...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                <span>Check Balances</span>
                            </>
                        )}
                    </button>
                </div>

                {balanceError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-600 text-sm">{balanceError}</p>
                    </div>
                )}

                {balanceInfo && currentAddress && (
                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-600">Showing balances for:</p>
                            <p className="font-mono text-gray-800">{currentAddress}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">USDC Balance:</span>
                            <span className="font-medium">{balanceInfo.accountUsdcBalance} USDC</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">ETH Balance:</span>
                            <span className="font-medium">{balanceInfo.accountEthBalance} ETH</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Marketplace USDC Balance:</span>
                            <span className="font-medium">{balanceInfo.marketplaceBalance} USDC</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white">
            {showSubscriptionIdInput && selectedOption && (
                <SubscriptionIdInput
                    onSubmit={(subscriptionId) => listNFTFunction(selectedOption, subscriptionId)}
                    onCancel={() => {
                        setShowSubscriptionIdInput(false);
                        setSelectedOption(null);
                    }}
                    loading={loading}
                />
            )}
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-pink-50 to-white border-b border-pink-100">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="relative">
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600 mb-2">
                            Model Dashboard
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Manage your profile and subscription options
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {renderBalanceInfo()}
                {/* Profile Summary */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100 mb-8">
                    <div className="flex items-center gap-6">
                        <div className="relative h-24 w-24 ring-2 ring-pink-400 ring-offset-2 rounded-full overflow-hidden">
                            {profileImage ? (
                                <Image
                                    src={profileImage}
                                    alt={model.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-pink-100 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-pink-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{model.name}</h2>
                            <p className="text-gray-600">{model.location}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                <span>{model.views}M views</span>
                                <span>{model.tease}K tease</span>
                                <span>{model.posts} posts</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription Management */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Subscription Options</h3>
                            <p className="text-sm text-gray-600 mt-1">Create and manage your subscription tiers</p>
                        </div>
                        <button
                            onClick={() => setIsAddingSubscription(true)}
                            className="bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add New Option
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            {success}
                        </div>
                    )}

                    {isAddingSubscription && (
                        <div className="bg-gradient-to-r from-pink-50/50 to-white border border-pink-100 rounded-xl p-6 mb-8">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">New Subscription Tier</h4>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price (USDC)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.price}
                                                onChange={handlePriceChange}
                                                className="w-full rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200 pl-12"
                                                placeholder="0.00"
                                                required
                                            />
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                                <span className="text-gray-500">$</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Duration
                                        </label>
                                        <select
                                            value={formData.duration}
                                            onChange={handleDurationChange}
                                            className="w-full rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200 bg-white"
                                        >
                                            {DURATION_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label} (Recommended: ${option.recommendedPrice})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                        rows={3}
                                        placeholder="Describe what subscribers will get with this tier..."
                                        required
                                    />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                <span>Adding...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                                <span>Add Subscription Option</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingSubscription(false)}
                                        className="px-6 py-3 rounded-full font-medium transition-all duration-200 border border-gray-200 hover:bg-gray-50 text-gray-600 flex items-center justify-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Existing Subscriptions List */}
                    <div className="mt-8 space-y-4">
                        {fetchingOptions ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                            </div>
                        ) : subscriptionOptions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No subscription options available. Add your first option!
                            </div>
                        ) : (
                            subscriptionOptions.map((option) => (
                                <div
                                    key={option.id}
                                    className="bg-white rounded-xl border border-pink-100 p-4 hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-lg font-semibold text-gray-800">
                                                ${option.price}
                                                <span className="ml-2 text-sm font-normal text-gray-600">
                                                    for {option.duration} days
                                                </span>
                                            </div>
                                            <p className="text-gray-600 mt-1">{option.description}</p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Created: {new Date(option.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="text-white bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-lg transition-colors duration-200"
                                                onClick={() => handleListNFT(option)}
                                                disabled={loading}
                                            >
                                                {loading ? 'Processing...' : 'List NFT'}
                                            </button>
                                            <button
                                                className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                                                onClick={() => {/* Add delete functionality */ }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 