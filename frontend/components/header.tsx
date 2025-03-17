"use client"

import useWeb3auth from "@/hooks/useWeb3auth";
import useGlobalStore from "@/hooks/useGlobalStore";
import { userOnBoarding } from "@/lib/functions";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from 'next/image';

const Header = () => {
  const { login, loggedIn, logout, name, provider, email, smartAccount } = useWeb3auth();
  const { smartAddress } = useGlobalStore();
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [openAiTokenId, setOpenAiTokenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchUserDetails = async (address: string | null, name: string) => {
    try {
      if (!address) return;

      const response_user_details = await axios.get(`http://localhost:8080/user-info?wallet_address=${address}`);
      const data = await response_user_details.data;

      console.log("FETCH USER DETAILS", data);

      if (data.success) {
        setIsLoading(false);
        if (data?.data?.user?.ipfs_url) {
          setIpfsUrl(data.data.user.ipfs_url);
          console.log("IPFS URL", data.data.user.ipfs_url);
          try {
            const ipfsResponse = await axios.get(data.data.user.ipfs_url);
            const ipfsData = ipfsResponse.data;

            console.log("IPFS Data:", ipfsData);

            if (ipfsData && ipfsData.image) {
              setProfileImage(ipfsData.image);
            } else {
              console.log("No image found in ipfsUrl data");
              setProfileImage(null);
            }
          } catch (e) {
            console.log("Error fetching or parsing IPFS data:", e);
            setProfileImage(data.data.user.ipfs_url);
          }
        } else {
          console.log("No valid ipfsUrl found in response");
          setProfileImage(null);
        }
        setOpenAiTokenId(data.openAiTokenId);
      } else {
        setIsLoading(false);
        createNFT(name);
      }
    } catch (err) {
      setIsLoading(false);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        createNFT(name);
      } else {
        console.log(err);
      }
    }
  }

  const createNFT = async (name: string) => {
    try {
      const response_avatar_image = await axios.post('http://localhost:8080/generate-avatar-imagepig', {
        name: name,
        prompt: "A beautiful avatar of a woman"
      })

      const data = await response_avatar_image.data;

      if (true) {
        const response_user_onboarding = await userOnBoarding(name, smartAccount);

        console.log("RESPONSE USER ONBOARDING", response_user_onboarding);

        if (response_user_onboarding?.hash) {
          const response_create_nft_pin_metadata = await axios.post("http://localhost:8080/create-nft-pin-metadata", {
            name: name,
            description: "A beautiful avatar of a woman",
          })

          const data_response_user_onboarding = await response_create_nft_pin_metadata.data;

          if (data_response_user_onboarding.success) {
            console.log("DATA RESPONSE USER ONBOARDING", data_response_user_onboarding);
            const response_register = await axios.post("http://localhost:8080/register", {
              username: name,
              email: email,
              wallet_address: smartAddress,
              ipfs_url: data_response_user_onboarding.ipfsUrl,
              openAi_tokenId: data_response_user_onboarding.tokenId || "",
            })

            const data_response_register = await response_register.data;

            if (data_response_register.success) {
              fetchUserDetails(smartAddress || '', name);
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    if (smartAddress && name) {
      console.log("USE EFFECT", smartAddress, name);
      setIsLoading(true);
      fetchUserDetails(smartAddress, name);
      setIsLoading(false);
    }
  }, [smartAddress, name]);


  return (
    <div className="bg-white shadow-lg border-b border-pink-100 p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {profileImage ? (
            <div className="relative h-12 w-12 ring-2 ring-pink-400 ring-offset-2 rounded-full overflow-hidden">
              <Image
                src={profileImage}
                alt={name || 'Profile'}
                width={48}
                height={48}
                className="rounded-full object-cover hover:scale-110 transition-transform duration-200"
              />
            </div>
          ) : (
            <div className="h-12 w-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {name?.charAt(0) || '?'}
            </div>
          )}
          <div>
            {name && (
              <span className="text-gray-800 font-semibold hover:text-pink-500 transition-colors cursor-pointer">
                {name}
              </span>
            )}
            {smartAddress && (
              <p className="text-gray-500 text-sm hover:text-pink-400 transition-colors">
                {`${smartAddress.slice(0, 6)}...${smartAddress.slice(-4)}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {!smartAddress ? (
            <button
              onClick={() => login(0)}
              className="bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-8 py-2.5 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-pink-200"
            >
              Connect Wallet
            </button>
          ) : (
            <button
              onClick={logout}
              className="bg-white text-pink-500 border-2 border-pink-400 px-8 py-2 rounded-full font-medium transition-all duration-200 hover:bg-pink-50 hover:border-pink-500"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* <button onClick={() => { createNFT(name || '') }}>Create NFT</button> */}
      </div>
    </div>
  )
}

export default Header;