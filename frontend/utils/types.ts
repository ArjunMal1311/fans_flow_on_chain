export type batchSubscribeProps = {
    modelId: number;
    subscriptionId: number;
    priceInUSD: number;
    provider: any;
};

export type MintingNFTProps = {
    modelId: number;
    subscriptionId: number;
    duration: number;
    fromAddress: string;
};

export type approveNSubscribeProps = {
    provider: any;
    priceInUSD: number;
}
