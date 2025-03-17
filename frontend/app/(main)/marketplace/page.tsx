'use client';

import { useState } from 'react';
import { MarketData } from '@/utils/network-data';
import Market from './_components/market';

const Page = () => {
    const [collection, setCollection] = useState("");

    return (
        <div className="min-h-screen bg-white">
            <div className="relative overflow-hidden bg-gradient-to-r from-pink-50 to-white border-b border-pink-100">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="relative">
                        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600 mb-2 animate-gradient">
                            Only Fans on Chain
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl">
                            The first decentralized platform for content creators and their fans.
                            Secure, transparent, and always yours.
                        </p>
                        {/* Decorative elements */}
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

                <Market />
            </div>

            <style jsx global>{`
                @keyframes gradient {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
                
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 8s ease infinite;
                }
            `}</style>
        </div>
    )
}

export default Page;