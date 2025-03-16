import { ethers } from "hardhat";

export default async ({ getNamedAccounts, deployments }: { getNamedAccounts: any, deployments: any }) => {
    console.log("Deploying Avatar contract...");
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const avatar = await deploy('Avatar', {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1
    });

    console.log(`Avatar contract deployed to: ${avatar.address}`);
};

module.exports.tags = ['AvatarDeployment']; 