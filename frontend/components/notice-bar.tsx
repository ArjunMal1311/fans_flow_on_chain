import Link from 'next/link';

export function NoticeBar() {
    return (
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <p className="text-sm">
                    🚧 Using local Hardhat network for development
                </p>
                <Link
                    href="/test-accounts"
                    className="text-sm underline hover:text-pink-100 transition-colors"
                >
                    View test accounts
                </Link>
            </div>
        </div>
    );
} 