"use client"
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-purple-900 to-black text-white">
      <div className="max-w-4xl text-center">
        <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          OnChainFans
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          The first decentralized creator platform. Own your content, connect with fans, earn crypto.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 rounded-full font-bold hover:opacity-90 transition">
            Connect Wallet
          </button>
          <button className="border-2 border-purple-500 px-8 py-3 rounded-full font-bold hover:bg-purple-500/20 transition">
            Become a Creator
          </button>
          <Link
            href="/feed"
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-3 rounded-full font-bold hover:opacity-90 transition flex items-center gap-2"
          >
            <span>Explore Feed</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <div className="bg-purple-900/30 p-6 rounded-xl backdrop-blur-sm">
          <div className="text-3xl mb-4">🔒</div>
          <h3 className="text-xl font-bold mb-2">Decentralized</h3>
          <p className="text-gray-300">Your content, your rules. No intermediaries.</p>
        </div>
        <div className="bg-purple-900/30 p-6 rounded-xl backdrop-blur-sm">
          <div className="text-3xl mb-4">💎</div>
          <h3 className="text-xl font-bold mb-2">Crypto Payments</h3>
          <p className="text-gray-300">Accept payments in multiple cryptocurrencies.</p>
        </div>
        <div className="bg-purple-900/30 p-6 rounded-xl backdrop-blur-sm">
          <div className="text-3xl mb-4">🌐</div>
          <h3 className="text-xl font-bold mb-2">NFT Access</h3>
          <p className="text-gray-300">Exclusive content through NFT memberships.</p>
        </div>
      </div>

      <div className="flex gap-12 text-center">
        <div>
          <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            100K+
          </div>
          <div className="text-gray-400">Creators</div>
        </div>
        <div>
          <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            1M+
          </div>
          <div className="text-gray-400">Users</div>
        </div>
        <div>
          <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            $10M+
          </div>
          <div className="text-gray-400">Earned</div>
        </div>
      </div>
    </div>
  );
}
