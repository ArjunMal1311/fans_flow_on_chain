'use client';

import axios from 'axios';
import Profile from './_components/profile';
import { useEffect, useState } from 'react';
import { ModelData } from "@/utils/model-data";

interface IPFSMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
}

interface Props {
    params: {
        id: string;
    };
}

const Page = ({ params }: Props) => {
    const [model, setModel] = useState<ModelData | null>(null);
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
        const fetchModel = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/model/${params.id}`);
                if (response.data.success) {
                    const foundModel = response.data.data;

                    if (foundModel.ipfs_url) {
                        const metadata = await fetchIPFSMetadata(foundModel.ipfs_url);
                        if (metadata) {
                            setModel({
                                ...foundModel,
                                image: { src: metadata.image },
                                icon: { src: metadata.image }
                            });
                        } else {
                            setModel(foundModel);
                        }
                    } else {
                        setModel(foundModel);
                    }
                } else {
                    setError(response.data.error || 'Failed to fetch model');
                }
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch model. Please try again later.');
                console.error('Error fetching model:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchModel();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (error || !model) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center text-red-600">
                    {error || 'Model not found'}
                </div>
            </div>
        );
    }

    return <Profile model={model} />;
};

export default Page;