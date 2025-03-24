'use client';

import useGlobalStore from '@/hooks/useGlobalStore';
import { createBundler, createSmartAccountClient } from '@biconomy/account';
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { MetamaskAdapter } from '@web3auth/metamask-adapter';
import { Web3Auth } from '@web3auth/modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { ethers } from 'ethers';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

if (!clientId) {
    throw new Error('NEXT_PUBLIC_WEB3AUTH_CLIENT_ID is not set');
}

export const chainConfig = [
    {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: '0x7A69',
        rpcTarget: 'http://127.0.0.1:8545',
        displayName: 'Hardhat Local',
        blockExplorerUrl: '',
        ticker: 'ETH',
        tickerName: 'ETH',
    },
    {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: '0xA869',
        rpcTarget: 'https://rpc.ankr.com/avalanche_fuji',
        displayName: 'Avalanche FUJI C-Chain',
        blockExplorerUrl: 'https://testnet.snowtrace.io',
        ticker: 'AVAX',
        tickerName: 'AVAX',
        logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    },
    {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: '0xaa36a7',
        rpcTarget: 'https://eth-sepolia.public.blastapi.io',
        displayName: 'Ethereum Sepolia',
        blockExplorerUrl: 'https://sepolia.etherscan.io/',
        ticker: 'ETH',
        tickerName: 'Ethereum',
    },
    {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: '0x13882',
        rpcTarget: 'https://rpc-amoy.polygon.technology',
        displayName: 'Polygon Amoy',
        blockExplorerUrl: 'https://www.oklink.com/amoy',
        ticker: 'MATIC',
        tickerName: 'Polygon Matic',
    },
    {
        chainNamespace: CHAIN_NAMESPACES.OTHER,
        chainId: "0x98A",
        rpcTarget: 'https://rpc.cardona.zkevm-rpc.com',
        displayName: "Polygon Cardona",
        blockExplorer: "https://cardona-zkevm.polygonscan.com/",
        ticker: "ETH",
        tickerName: "Ethereum"
    },
];

const config = [
    {
        biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY,
        bundlerUrl: 'http://127.0.0.1:8545',
        chainId: 31337,
    },
    {
        biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY,
        bundlerUrl: `https://paymaster.biconomy.io/api/v1/43113/${process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY}`,
        chainId: 11155111,
    },
    {
        biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY,
        bundlerUrl: `https://paymaster.biconomy.io/api/v1/43113/${process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY}`,
        chainId: 80002,
    },
    {
        biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY,
        bundlerUrl: `https://paymaster.biconomy.io/api/v1/43113/${process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY}`,
        chainId: 2442,
    },
];

const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig: chainConfig[0] },
});

const web3auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider,
    uiConfig: {
        appName: 'OFOC',
        mode: 'dark',
        defaultLanguage: 'en',
    },
});

const metamaskAdapter = new MetamaskAdapter({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
});

const openloginAdapter = new OpenloginAdapter();
web3auth.configureAdapter(openloginAdapter);
web3auth.configureAdapter(metamaskAdapter);

function useWeb3auth() {
    const { setSmartAccount, smartAccount, setSmartAddress } = useGlobalStore();
    const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
    const [provider, setProvider] = useState<IProvider | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [address, setAddress] = useState<string | null>('');
    const [name, setName] = useState<string | undefined>('');
    const [email, setEmail] = useState<string | undefined>('');
    const pathname = usePathname();

    const init = async () => {
        try {
            await web3auth.initModal();
            if (smartAccount) {
                const saAddress = await smartAccount.getAccountAddress();
                setSmartAccountAddress(saAddress);
                setLoggedIn(true);
            }
            setProvider(web3auth.provider);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        init();
    }, [pathname]);

    useEffect(() => {
        if (loggedIn) {
            getUserInfo();
            getAccounts();
        }
    }, [loggedIn]);

    const login = async (chainIndex: number) => {
        try {
            const web3authProvider = await web3auth.connect();
            const ethersProvider = new ethers.providers.Web3Provider(web3authProvider as any);
            const web3AuthSigner = ethersProvider.getSigner();

            const currentConfig = config[chainIndex] || config[0];
            const currentChainConfig = chainConfig[chainIndex] || chainConfig[0];

            const bundler = await createBundler({
                bundlerUrl: currentConfig.bundlerUrl,
                chainId: currentConfig.chainId,
                userOpReceiptIntervals: {
                    [currentConfig.chainId]: 30000
                },
                userOpWaitForTxHashIntervals: {
                    [currentConfig.chainId]: 30000
                },
                userOpReceiptMaxDurationIntervals: {
                    [currentConfig.chainId]: 30000
                },
                userOpWaitForTxHashMaxDurationIntervals: {
                    [currentConfig.chainId]: 30000
                }
            });

            const smartWallet = await createSmartAccountClient({
                signer: web3AuthSigner,
                biconomyPaymasterApiKey: currentConfig.biconomyPaymasterApiKey,
                bundler: bundler,
                rpcUrl: currentChainConfig.rpcTarget,
                chainId: currentConfig.chainId,
            });

            setSmartAccount(smartWallet);
            const saAddress = await smartWallet.getAccountAddress();
            setSmartAddress(saAddress);
            setSmartAccountAddress(saAddress);
            setProvider(web3authProvider);
            
            if (web3auth.connected) {
                setLoggedIn(true);
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const getUserInfo = async () => {
        const user = await web3auth.getUserInfo();
        setName(user.name);
        setEmail(user.email);
    };

    const getAccounts = async () => {
        if (!provider) {
            return;
        }
        const saAddress = await smartAccount?.getAccountAddress();
        setAddress(saAddress || null);
        setSmartAddress(saAddress || null);
    };

    const logout = async () => {
        await web3auth.logout();
        setProvider(null);
        setLoggedIn(false);
        setAddress('');
    };

    return {
        login,
        logout,
        loggedIn,
        name,
        smartAccountAddress,
        provider,
        address,
        email,
        smartAccount,
    };
}

export default useWeb3auth;
