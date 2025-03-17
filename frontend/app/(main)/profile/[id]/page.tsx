import { Metadata } from 'next';
import { allModelData } from "@/utils/model-data";
import Profile from './_components/profile';

export type Props = {
    params: {
        id: string;
    };
};

const Page = async ({ params }: Props) => {
    const profile = allModelData.find(model => model.id === params.id);

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">Profile Not Found</h1>
                    <p className="text-gray-400 mt-2">The profile you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return <Profile profile={profile} />;
};

export default Page;