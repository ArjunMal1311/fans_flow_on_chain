# OnlyFans On Chain

A decentralized content subscription platform built on blockchain technology, enabling secure, transparent, and efficient content monetization.

## Overview

OnlyFans On Chain is a decentralized platform that allows content creators to monetize their content through blockchain technology. The platform utilizes smart contracts to manage subscriptions, NFT-based access control, and automated market operations.

## Key Features

- NFT-based subscription management
- Cross-chain subscription purchases
- Automated marketplace operations
- VRF-based random number generation for secure operations
- Chainlink automation for recurring tasks
- User onboarding with dynamic NFT avatar generation
- Batch transaction support for gas optimization

## Smart Contracts Architecture

### Core Contracts

1. **MarketPlace.sol**
   - Manages content listing and purchases
   - Handles subscription transactions
   - Implements royalty distribution
   - Uses ERC1155 for efficient token management

2. **NFT.sol**
   - ERC1155 implementation for subscription tokens
   - Handles token expiration and renewal
   - Manages royalty information
   - Implements role-based access control

3. **PurchaseSubscription.sol**
   - Handles subscription purchases
   - Supports both token and ETH payments
   - Maintains subscription records

4. **UserOnboarding.sol**
   - Manages user avatar NFTs
   - Integrates Chainlink Functions for dynamic NFT generation
   - Handles IPFS metadata storage

### Automation & Cross-chain

1. **ChainLink Automation**
   - `MarketplaceAutomation.sol`: Handles automated marketplace operations
   - `MarketplaceVrfAutomation.sol`: Implements VRF for secure random number generation

2. **Cross-chain Integration**
   - `SourcePurchaseSubscription.sol`: Manages subscription purchases on source chain
   - `DestinationMarketplace.sol`: Handles cross-chain marketplace operations

3. **zkSync Integration**
   - `ChainLinkFeederMarketplace.sol`: Implements price feeds and marketplace operations on zkSync

## Setup and Installation

1. Clone the repository:
```bash
git clone
cd only_fans_on_chain
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Compile contracts:
```bash
npx hardhat compile
```

5. Run tests:
```bash
npx hardhat test
```

## Deployment

The project uses Hardhat Ignition for deployment orchestration:

```bash
npx hardhat deploy
```

## Testing

Run the test suite:

```bash
npx hardhat test
REPORT_GAS=true npx hardhat test  # With gas reporting
```

## Security Considerations

- All contracts implement reentrancy protection
- Role-based access control for administrative functions
- Timelock mechanisms for critical operations
- Comprehensive input validation
- Chainlink VRF for secure randomness

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

This project builds upon and is inspired by:
- [BlockTease-BlockMagic/Backend](https://github.com/BlockTease-BlockMagic/Backend)
- OpenZeppelin Contracts
- Chainlink Oracle Network
- zkSync Era
