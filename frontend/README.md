# OnlyFans on Chain 🌸

A decentralized platform for content creators and their fans, built on blockchain technology. This platform enables secure, transparent, and direct interactions between creators and their audience.

## Features ✨

- **Web3 Authentication**: Secure login using blockchain wallets
- **Creator Profiles**: Customizable profiles with NFT avatars
- **Content Monetization**: Direct payments using cryptocurrency
- **Decentralized Storage**: Content stored on IPFS
- **Smart Contract Integration**: Transparent and secure transactions
- **Responsive Design**: Beautiful UI that works on all devices

## Tech Stack 🛠

- **Frontend**: Next.js 14, React, TailwindCSS
- **Authentication**: Web3Auth
- **Blockchain**: Ethereum/Polygon
- **Storage**: IPFS
- **Smart Contracts**: Solidity
- **Styling**: TailwindCSS with custom animations

## Getting Started 🚀

1. Clone the repository:
```bash
git clone https://github.com/yourusername/onlyfans_on_chain_frontend.git
cd onlyfans_on_chain_frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Fill in your environment variables
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables 🔑

Create a `.env.local` file with the following:

```env
# Web3Auth Configuration (Required)
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id  # Get this from Web3Auth Dashboard

# Backend Configuration (Required)
NEXT_PUBLIC_BACKEND_URL=your_backend_url  # Your backend API URL

# Blockchain Configuration (Optional)
NEXT_PUBLIC_RPC_URL=your_rpc_url  # Your blockchain RPC URL
```

For security:
- Never commit your `.env.local` file
- Keep your Web3Auth client ID private
- Use different keys for development and production

## Project Structure 📁

```
├── app/                  # Next.js app directory
│   ├── (main)/          # Main routes
│   │   ├── marketplace/ # Marketplace components
│   │   └── profile/     # Profile components
├── components/          # Reusable components
├── hooks/              # Custom React hooks
├── lib/               # Utility functions
├── public/            # Static assets
└── styles/           # Global styles
```

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact 📧

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/onlyfans_on_chain_frontend](https://github.com/yourusername/onlyfans_on_chain_frontend)

---

Built with ❤️ by [Your Name/Team]
