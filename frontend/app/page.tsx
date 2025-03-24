"use client"
import Link from "next/link";
import { NoticeBar } from "@/components/notice-bar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <NoticeBar />
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-50 to-white border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="relative z-10 text-center">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600 mb-4 animate-gradient">
              OnChainFans
            </h1>
            <p className="text-gray-600 text-xl mb-8 max-w-2xl mx-auto">
              The first decentralized creator platform. Own your content, connect with fans, earn crypto.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-pink-200"
              >
                Dashboard
              </Link>
              <Link
                href="/register"
                className="border-2 border-pink-400 text-pink-600 px-8 py-3 rounded-full font-medium hover:bg-pink-50 transition-all duration-200"
              >
                Become a Creator
              </Link>
              <Link
                href="/marketplace"
                className="bg-gradient-to-r from-purple-400 to-pink-500 text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition-all duration-200 flex items-center gap-2"
              >
                <span>Marketplace</span>
                <span>→</span>
              </Link>
              <Link
                href="/my-subscriptions"
                className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition-all duration-200"
              >
                My Subscriptions
              </Link>
              <Link
                href="/resell"
                className="border-2 border-purple-400 text-purple-600 px-8 py-3 rounded-full font-medium hover:bg-purple-50 transition-all duration-200"
              >
                Resell NFTs
              </Link>
            </div>
          </div>
          <div className="absolute -top-24 -right-20 w-64 h-64 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-64 h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl" />
        </div>
      </div>

      {/* Core Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group bg-white rounded-xl p-8 shadow-sm border border-pink-100 hover:shadow-lg hover:border-pink-200 transition-all duration-300">
            <div className="text-3xl mb-4 bg-gradient-to-br from-pink-50 to-white w-12 h-12 rounded-full flex items-center justify-center">🔒</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Decentralized</h3>
            <p className="text-gray-600">Your content, your rules. No intermediaries.</p>
          </div>
          <div className="group bg-white rounded-xl p-8 shadow-sm border border-pink-100 hover:shadow-lg hover:border-pink-200 transition-all duration-300">
            <div className="text-3xl mb-4 bg-gradient-to-br from-pink-50 to-white w-12 h-12 rounded-full flex items-center justify-center">💎</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Crypto Payments</h3>
            <p className="text-gray-600">Accept payments in multiple cryptocurrencies.</p>
          </div>
          <div className="group bg-white rounded-xl p-8 shadow-sm border border-pink-100 hover:shadow-lg hover:border-pink-200 transition-all duration-300">
            <div className="text-3xl mb-4 bg-gradient-to-br from-pink-50 to-white w-12 h-12 rounded-full flex items-center justify-center">🌐</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">NFT Access</h3>
            <p className="text-gray-600">Exclusive content through NFT memberships.</p>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="bg-gradient-to-r from-pink-50 to-white border-t border-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Powered By</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-xl p-8 shadow-sm border border-pink-100 hover:shadow-lg hover:border-pink-200 transition-all duration-300">
              <div className="text-3xl mb-4 bg-gradient-to-br from-pink-50 to-white w-12 h-12 rounded-full flex items-center justify-center">⛓️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Smart Contracts</h3>
              <p className="text-gray-600">Transparent and secure transactions on Ethereum/Polygon.</p>
            </div>
            <div className="group bg-white rounded-xl p-8 shadow-sm border border-pink-100 hover:shadow-lg hover:border-pink-200 transition-all duration-300">
              <div className="text-3xl mb-4 bg-gradient-to-br from-pink-50 to-white w-12 h-12 rounded-full flex items-center justify-center">📦</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">IPFS Storage</h3>
              <p className="text-gray-600">Decentralized content storage for permanent availability.</p>
            </div>
            <div className="group bg-white rounded-xl p-8 shadow-sm border border-pink-100 hover:shadow-lg hover:border-pink-200 transition-all duration-300">
              <div className="text-3xl mb-4 bg-gradient-to-br from-pink-50 to-white w-12 h-12 rounded-full flex items-center justify-center">🔐</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Web3 Auth</h3>
              <p className="text-gray-600">Secure authentication using blockchain wallets.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
