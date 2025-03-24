"use client"

import axios from "axios"
import * as z from "zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import useWeb3auth from '@/hooks/useWeb3auth'
import useGlobalStore from "@/hooks/useGlobalStore"
// import { userOnBoarding } from "@/lib/functions"

const userFormSchema = z.object({
    type: z.enum(["user", "model"]),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    prompt: z.string().min(10, "Prompt must be at least 10 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    modelId: z.string().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    location: z.string().optional(),
    aboutMe: z.string().optional(),
    value: z.number().optional(),
})

type UserFormValues = z.infer<typeof userFormSchema>

export function RegisterForm() {
    const router = useRouter()
    const { login, loggedIn, logout, name, provider, email, smartAccount } = useWeb3auth();
    const { smartAddress } = useGlobalStore();
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            type: "user",
            username: "",
            email: email,
            prompt: "A beautiful avatar",
            description: "User NFT for Fans Flow On Chain"
        },
    })
    const userType = form.watch("type")

    const createNFT = async (data: UserFormValues) => {
        try {
            setIsLoading(true);
            setError(null);

            console.log("DATA", data);

            const response_avatar_image = await axios.post('http://localhost:8080/generate-avatar-imagepig', {
                name: data.username,
                prompt: data.prompt
            });

            console.log("RESPONSE AVATAR IMAGE", response_avatar_image);

            const avatar_data = await response_avatar_image.data;
            console.log("Avatar generated:", avatar_data);

            // const response_user_onboarding = await userOnBoarding(data.username, smartAccount);
            // console.log("RESPONSE USER ONBOARDING", response_user_onboarding);

            if (true) { // TODO: Remove this
                const response_create_nft_pin_metadata = await axios.post("http://localhost:8080/create-nft-pin-metadata", {
                    name: data.username,
                    description: data.description,
                    image: avatar_data.image_url
                });

                const data_response_user_onboarding = await response_create_nft_pin_metadata.data;

                if (data_response_user_onboarding.success) {
                    console.log("DATA RESPONSE USER ONBOARDING", data_response_user_onboarding);

                    const requestData = data.type === "model" ? {
                        name: data.name,
                        model_id: data.modelId,
                        email: data.email,
                        wallet_address: smartAddress,
                        slug: data.slug,
                        location: data.location,
                        about_me: data.aboutMe,
                        value: data.value,
                        views: 0,
                        tease: 0,
                        posts: 0,
                        image: { src: avatar_data.image_url },
                        icon: { src: avatar_data.image_url },
                        ipfs_url: data_response_user_onboarding.ipfsUrl,
                        openAi_tokenId: data_response_user_onboarding.tokenId || ""
                    } : {
                        username: data.username,
                        email: data.email,
                        wallet_address: smartAddress,
                        ipfs_url: data_response_user_onboarding.ipfsUrl,
                        openAi_tokenId: data_response_user_onboarding.tokenId || "",
                        avatar_url: avatar_data.image_url
                    };

                    const endpoint = data.type === "model" ? "register-model" : "register";
                    const response_register = await axios.post(`http://localhost:8080/${endpoint}`, requestData);

                    const data_response_register = await response_register.data;

                    if (data_response_register.success) {
                        router.push("/marketplace");
                    } else {
                        setError(data_response_register.error || "Registration failed");
                    }
                }
            }
        } catch (err) {
            console.log(err);
            setError("Failed to create NFT and register. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    async function onSubmit(data: UserFormValues) {
        if (!smartAddress || !smartAccount) {
            setError("Please connect your wallet first")
            return
        }
        await createNFT(data);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl relative">
                        {error}
                    </div>
                )}

                <div className="bg-gradient-to-r from-pink-50 to-white border border-pink-100 text-gray-700 px-4 py-3 rounded-xl relative">
                    <p className="font-medium">Connected Wallet: {smartAddress}</p>
                </div>

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-gray-700 font-medium">Account Type</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4"
                                >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="user" className="text-pink-500 border-pink-200" />
                                        </FormControl>
                                        <FormLabel className="font-medium text-gray-700">
                                            User
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="model" className="text-pink-500 border-pink-200" />
                                        </FormControl>
                                        <FormLabel className="font-medium text-gray-700">
                                            Model
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter your username"
                                    className="rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter your email"
                                    type="email"
                                    className="rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Avatar Prompt</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe how you want your avatar to look"
                                    className="resize-none rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-700 font-medium">NFT Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe your NFT"
                                    className="resize-none rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />

                {userType === "model" && (
                    <>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">Display Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter your display name"
                                            className="rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="modelId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">Model ID</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter your model ID"
                                            className="rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">Slug</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter your profile slug"
                                            className="rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">Location</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter your location"
                                            className="rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="aboutMe"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">About Me</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us about yourself"
                                            className="resize-none rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">Subscription Value</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Enter subscription value"
                                            className="rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />
                    </>
                )}

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-pink-200"
                    disabled={isLoading}
                >
                    {isLoading ? "Creating account..." : "Create account"}
                </Button>
            </form>
        </Form>
    )
}
