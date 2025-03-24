'use client';

import axios from 'axios';
import useWeb3auth from '@/hooks/useWeb3auth';
import useGlobalStore from '@/hooks/useGlobalStore';
import DashboardView from './_components/dashboard-view';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModelData } from '@/utils/model-data';

const DashboardPage = () => {
    const router = useRouter();
    const { login, loggedIn } = useWeb3auth();
    const { smartAddress } = useGlobalStore();
    const [modelData, setModelData] = useState<ModelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            await login(0);
        } catch (err) {
            console.error('Failed to connect wallet:', err);
            setError('Failed to connect wallet. Please try again.');
        } finally {
            setIsConnecting(false);
        }
    };

    useEffect(() => {
        const fetchModelData = async () => {
            if (!smartAddress) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`http://localhost:8080/user-info?wallet_address=${smartAddress}`);
                if (response.data.success) {
                    const userData = response.data.data;
                    if (userData.user && userData.user.model_id) {
                        setModelData(userData.user);
                    } else {
                        const modelInfo = response.data.data.user;
                        if (modelInfo && modelInfo.model_id) {
                            setModelData(modelInfo);
                        } else {
                            setError('No model account found. Please register as a model first.');
                        }
                    }
                } else {
                    setError(response.data.error || 'Failed to fetch model data');
                }
            } catch (err: any) {
                if (err.response?.status === 404) {
                    setError('No model account found. Please register as a model first.');
                } else {
                    setError(err.response?.data?.error || 'Failed to fetch model data');
                    console.error('Error fetching model data:', err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchModelData();
    }, [smartAddress]);

    if (!loggedIn && !isConnecting) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Model Dashboard</h2>
                        <p className="text-gray-600 mb-6">Please connect your wallet to access your dashboard</p>
                        <button
                            onClick={handleConnect}
                            className="bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-pink-200"
                        >
                            Connect Wallet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading || isConnecting) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
                <p className="text-gray-600">{isConnecting ? 'Connecting wallet...' : 'Loading dashboard...'}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-600">{error}</p>
                        {error.includes('register') && (
                            <button
                                onClick={() => router.push('/register')}
                                className="mt-4 bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200"
                            >
                                Register as Model
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!modelData) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-600">No model data available. Please register as a model first.</p>
                        <button
                            onClick={() => router.push('/register')}
                            className="mt-4 bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200"
                        >
                            Register as Model
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <DashboardView model={modelData} />;
};

export default DashboardPage; 