"use client"

import Header from '@/components/header';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/react';
import { ReactNode } from 'react';

const projectId = '55d7757ac17f44df8e16ecb3b5be5f30'

export const moonbase = {
    chainId: 1287,
    name: 'Moonbase Alpha',
    currency: 'DEV',
    rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
    explorerUrl: 'https://moonbase.moonscan.io',
};

export const polygonAmoy = {
    chainId: 80002,
    name: 'Polygon Amoy',
    currency: 'MATIC',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://www.oklink.com/amoy',
};

export const zkSync = {
    chainId: 300,
    name: 'zkSync Era Sepolia Testnet',
    currency: 'ETH',
    rpcUrl: 'https://sepolia.era.zksync.dev',
    explorerUrl: 'https://sepolia.explorer.zksync.io',
};

export const morph = {
    chainId: 2810,
    name: 'Morph Holesky Testnet',
    currency: 'ETH',
    rpcUrl: 'https://rpc-quicknode-holesky.morphl2.io',
    explorerUrl: 'https://explorer-holesky.morphl2.io',
};


export const avalanche = {
    chainId: 43113,
    name: 'Avalanche FUJI C-Chain',
    currency: 'AVAX',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
};


const metadata = {
    name: 'Only Fans on Chain',
    description: 'OnlyFans for web3',
    url: 'http://localhost:3000',
    icons: ['https://avatars.mywebsite.com/'],
};


const ethersConfig = defaultConfig({
    metadata,
    enableEIP6963: true,
    enableInjected: true,
    enableCoinbase: true,
    rpcUrl: '...',
    defaultChainId: 1,
})


createWeb3Modal({
    defaultChain: avalanche,
    ethersConfig,
    chains: [avalanche],
    projectId,
    enableAnalytics: true,
    enableOnramp: true,
})


export default function BlockchainProvider({ children }: { children: ReactNode }) {
    return <>
        <Header />
        {children}
    </>;
}