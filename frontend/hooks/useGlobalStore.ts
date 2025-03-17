import { create } from 'zustand';
import { BiconomySmartAccountV2 } from '@biconomy/account';

interface GlobalStore {
    smartAccount: BiconomySmartAccountV2 | null;
    setSmartAccount: (account: BiconomySmartAccountV2 | null) => void;
    smartAddress: string | null;
    setSmartAddress: (address: string | null) => void;
}

const useGlobalStore = create<GlobalStore>((set: any) => ({
    smartAccount: null,
    setSmartAccount: (account: BiconomySmartAccountV2 | null) => set({ smartAccount: account }),
    smartAddress: null,
    setSmartAddress: (address: string | null) => set({ smartAddress: address }),
}));

export default useGlobalStore; 