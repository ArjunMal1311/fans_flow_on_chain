'use client';

import React from 'react';
import useWeb3auth from '@/hooks/useWeb3auth';
import { ModelData } from '@/utils/model-data';
import Image from 'next/image';

interface ProfileProps {
    profile: ModelData;
}

const Profile: React.FC<ProfileProps> = ({ profile }) => {
    const { address, smartAccount, loggedIn } = useWeb3auth();

    return (
        <div className="min-h-screen bg-white">
            <div className="relative h-80 w-full">
                <Image
                    src={profile.image.src}
                    alt={profile.name}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            </div>

            <div className="relative -mt-32 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-pink-100">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative h-32 w-32 ring-4 ring-pink-400 ring-offset-4 rounded-full overflow-hidden">
                                <Image
                                    src={profile.icon.src}
                                    alt={profile.name}
                                    width={128}
                                    height={128}
                                    className="rounded-full object-cover hover:scale-110 transition-transform duration-200"
                                />
                            </div>
                            <div className="text-center sm:text-left">
                                <h1 className="text-3xl font-bold text-gray-800">{profile.name}</h1>
                                <p className="text-pink-500">{profile.location}</p>
                                <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-4">
                                    <div className="text-gray-600">
                                        <span className="text-pink-500 font-bold">{profile.posts}</span> Posts
                                    </div>
                                    <div className="text-gray-600">
                                        <span className="text-pink-500 font-bold">{profile.views.toLocaleString()}</span> Views
                                    </div>
                                    <div className="text-gray-600">
                                        <span className="text-pink-500 font-bold">{profile.Tease}</span> Teases
                                    </div>
                                </div>
                            </div>

                            <div className="ml-auto">
                                {loggedIn ? (
                                    <button className="bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-pink-200">
                                        Subscribe ({profile.value} USDC)
                                    </button>
                                ) : (
                                    <button className="bg-gray-100 text-gray-400 px-8 py-3 rounded-full font-medium cursor-not-allowed">
                                        Connect Wallet to Subscribe
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">About Me</h2>
                            <p className="text-gray-600 whitespace-pre-wrap">{profile.AboutMe}</p>
                        </div>

                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-6 border border-pink-100 hover:shadow-lg transition-shadow">
                                <h3 className="text-gray-500 text-sm">Subscription Price</h3>
                                <p className="text-2xl font-bold text-pink-500">{profile.value} USDC</p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-6 border border-pink-100 hover:shadow-lg transition-shadow">
                                <h3 className="text-gray-500 text-sm">Total Views</h3>
                                <p className="text-2xl font-bold text-pink-500">{profile.views.toLocaleString()}</p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-6 border border-pink-100 hover:shadow-lg transition-shadow">
                                <h3 className="text-gray-500 text-sm">Total Posts</h3>
                                <p className="text-2xl font-bold text-pink-500">{profile.posts}</p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-6 border border-pink-100 hover:shadow-lg transition-shadow">
                                <h3 className="text-gray-500 text-sm">Tease Count</h3>
                                <p className="text-2xl font-bold text-pink-500">{profile.Tease}</p>
                            </div>
                        </div>

                        {loggedIn && address && (
                            <div className="mt-8 bg-gradient-to-br from-pink-50 to-white rounded-xl p-6 border border-pink-100">
                                <h3 className="text-gray-800 font-semibold mb-2">Connected Wallet</h3>
                                <p className="text-pink-500 font-mono text-sm">
                                    {address.slice(0, 6)}...{address.slice(-4)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile; 