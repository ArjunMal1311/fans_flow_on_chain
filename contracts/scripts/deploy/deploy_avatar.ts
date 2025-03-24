import { ethers } from "hardhat";

export default async ({ getNamedAccounts, deployments }: { getNamedAccounts: any, deployments: any }) => {
    console.log("Deploying Avatar contract...");
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const userOnboarding = await deploy('UserOnboarding', {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1
    });

    console.log(`UserOnboarding contract deployed to: ${userOnboarding.address}`);
};

module.exports.tags = ['UserOnboardingDeployment']; 