'use client';

import Market from './_components/market';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { MarketData } from '@/utils/network-data';
import { ModelData } from '@/utils/model-data';

interface IPFSMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
}

interface EnhancedModelData extends ModelData {
    cloudinaryImage?: string;
}

const Page = () => {
    const [collection, setCollection] = useState("");
    const [models, setModels] = useState<EnhancedModelData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchIPFSMetadata = async (ipfsUrl: string): Promise<IPFSMetadata | null> => {
        try {
            const response = await axios.get(ipfsUrl);
            return response.data;
        } catch (err) {
            console.error('Error fetching IPFS metadata:', err);
            return null;
        }
    };

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await axios.get('http://localhost:8080/models');
                if (response.data.success) {
                    const fetchedModels = response.data.data;

                    const enhancedModels = await Promise.all(
                        fetchedModels.map(async (model: ModelData) => {
                            if (model.ipfs_url) {
                                const metadata = await fetchIPFSMetadata(model.ipfs_url);
                                if (metadata) {
                                    return {
                                        ...model,
                                        image: { src: metadata.image },
                                        icon: { src: metadata.image }
                                    };
                                }
                            }
                            return model;
                        })
                    );

                    setModels(enhancedModels);
                } else {
                    setError(response.data.error || 'Failed to fetch models');
                }
            } catch (err) {
                setError('Failed to fetch models. Please try again later.');
                console.error('Error fetching models:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchModels();
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <div className="relative overflow-hidden bg-gradient-to-r from-pink-50 to-white border-b border-pink-100">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="relative">
                        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600 mb-2 animate-gradient">
                            Fans Flow on Chain
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl">
                            The first decentralized platform for content creators and their fans.
                            Secure, transparent, and always yours.
                        </p>
                        <div className="absolute -top-24 -right-20 w-64 h-64 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full opacity-20 blur-3xl" />
                        <div className="absolute -bottom-32 -right-20 w-64 h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-8">
                <div className="mb-8 px-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Methods</h3>
                    <div className="flex flex-wrap gap-3">
                        {MarketData.map((coin) => (
                            <button
                                key={coin.name}
                                className="group relative flex h-12 items-center gap-3 rounded-full bg-white px-4 transition-all duration-300 hover:bg-pink-50 hover:shadow-md border border-pink-100 hover:border-pink-200"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-50 to-white">
                                    <coin.icon className="h-5 w-5 text-pink-500" />
                                </div>
                                <span className="pr-2 text-sm font-medium text-gray-700 capitalize">
                                    {coin.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center min-h-[200px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-600 py-8">
                        {error}
                    </div>
                ) : (
                    <Market models={models} />
                )}
            </div>
        </div>
    )
}

export default Page;