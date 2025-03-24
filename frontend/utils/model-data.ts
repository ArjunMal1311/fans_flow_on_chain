export interface ModelData {
    id: string;
    name: string;
    model_id: string;
    email: string;
    wallet_address: string;
    ipfs_url: string;
    openai_token_id?: string;
    slug: string;
    location: string;
    about_me: string;
    value: number;
    views: number;
    tease: number;
    posts: number;
    image: {
        src: string;
    };
    icon: {
        src: string;
    };
}

export const allModelData: ModelData[] = []; 