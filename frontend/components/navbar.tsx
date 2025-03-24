import Link from 'next/link';

export function Navbar() {
    return (
        <nav className="bg-white border-b border-pink-100">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-pink-500">
                        Fans Flow On Chain
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/marketplace" className="text-gray-600 hover:text-pink-500 transition-colors">
                            Marketplace
                        </Link>
                        <Link href="/dashboard" className="text-gray-600 hover:text-pink-500 transition-colors">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
} 