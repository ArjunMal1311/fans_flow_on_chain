// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PurchaseSubscription {
    address public owner;
    IERC20 public stablecoin;

    
    struct Subscription {
        uint256 modelId;
        uint256 subscriptionId;
        uint256 priceInUSD;
    }

    mapping(address => Subscription[]) public subscriptions;

    event SubscribedWithToken(address indexed subscriber, uint256 modelId, uint256 subscriptionId, uint256 priceInUsd);
    event SubscribedWithEth(address indexed subscriber, uint256 modelId, uint256 subscriptionId, uint256 ethAmount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(address _stablecoinAddress) {
        owner = msg.sender;
        stablecoin = IERC20(_stablecoinAddress);
    }

    
    function subscribeWithToken(uint256 modelId, uint256 subscriptionId, uint256 priceInUSD) external {
        require(stablecoin.transferFrom(msg.sender, address(this), priceInUSD), "Transfer failed");
        Subscription memory newSubscription = Subscription({
            modelId: modelId,
            subscriptionId: subscriptionId,
            priceInUSD: priceInUSD
        });
        subscriptions[msg.sender].push(newSubscription);
        emit SubscribedWithToken(msg.sender, modelId, subscriptionId, priceInUSD);
    }
}
