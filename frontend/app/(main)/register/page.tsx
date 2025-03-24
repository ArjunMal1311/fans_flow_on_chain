import { Metadata } from "next"
import { RegisterForm } from "./_components/register-form"

export const metadata: Metadata = {
    title: "Register",
    description: "Register a new account",
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="relative overflow-hidden bg-gradient-to-r from-pink-50 to-white border-b border-pink-100">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="relative">
                        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600 mb-2 animate-gradient">
                            Create an Account
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl">
                            Join the first decentralized platform for content creators and their fans.
                        </p>
                        <div className="absolute -top-24 -right-20 w-64 h-64 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full opacity-20 blur-3xl" />
                        <div className="absolute -bottom-32 -right-20 w-64 h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl" />
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto py-8 px-4">
                <RegisterForm />
            </div>
        </div>
    )
}
