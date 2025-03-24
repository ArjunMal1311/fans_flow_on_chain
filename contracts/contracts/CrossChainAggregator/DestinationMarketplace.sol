// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";    
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "../nft.sol";

contract NFTMarketplace is CCIPReceiver, ReentrancyGuard, Ownable {
    BlockTeaseNFTs private nftContract;
    IERC20 public paymentToken;
    AggregatorV3Interface public priceFeed;
    uint256 public listingId=0;

    struct Model {
        uint256 priceUSD;
        address associatedAddress;
        uint256 royaltyFees;
    }

    struct Listing {
        uint256 price;
        address seller;
        bool isListed;
        uint256 tokenId;
    }

    mapping(uint256 => Listing) public listings;

    mapping(uint256 => Model) public models;

    event SubscriptionPurchased(address indexed buyer, uint256 modelId, uint256 subscriptionId, uint256 tokenId);
    event ModelUpdated(uint256 modelId, uint256 priceUSD, address associatedAddress, uint256 royaltyFee);
    event NFTListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event NFTSold(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 price);
    event SubscriptionPurchasedWithEth(address indexed subscriber, uint256 modelId, uint256 subscriptionId, uint256 ethAmount, uint256 tokenId);

    constructor( address _priceFeedAddress, address _router, address _nftContract, address _paymentToken) Ownable(msg.sender) CCIPReceiver(_router) {
        nftContract = BlockTeaseNFTs(_nftContract);
        paymentToken = IERC20(_paymentToken);
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }

    function _ccipReceive(
            Client.Any2EVMMessage memory message
        ) internal override {
        
        (uint256 modelId,uint256 subscriptionId, address user, uint256 duration) = abi.decode(message.data, (uint256, uint256, address, uint256));

        Model memory model = models[modelId];
        uint256 tokenId = nftContract._encodeTokenId(modelId, subscriptionId);
        nftContract.mint(user, modelId, subscriptionId, 1, duration, model.royaltyFees, model.associatedAddress, "");
        
        emit SubscriptionPurchased(user, modelId, subscriptionId, tokenId);
    }

    function updateModel(uint256 modelId, uint256 priceUSD, address associatedAddress, uint256 royaltyFee) public onlyOwner {
        models[modelId] = Model(priceUSD, associatedAddress, royaltyFee);
        emit ModelUpdated(modelId, priceUSD, associatedAddress, royaltyFee);
    }

    function updateBatchModels(uint256[] calldata modelIds, uint256[] calldata pricesUSD, address[] calldata associatedAddresses, uint256[] calldata royaltyFees) public onlyOwner {
        require(modelIds.length == pricesUSD.length && modelIds.length == associatedAddresses.length && modelIds.length == royaltyFees.length, "Data length mismatch");
        for (uint256 i = 0; i < modelIds.length; i++) {
            models[modelIds[i]] = Model(pricesUSD[i], associatedAddresses[i], royaltyFees[i]);
            emit ModelUpdated(modelIds[i], pricesUSD[i], associatedAddresses[i], royaltyFees[i]);
        }
    }

    function listNFT(uint256 tokenId, uint256 price) public {
        require(nftContract.balanceOf(msg.sender, tokenId) > 0, "Sender must own the NFT");
        require(nftContract.isApprovedForAll(msg.sender, address(this)), "Contract must be approved to manage NFT");

        listings[listingId] = Listing(price, msg.sender, true, tokenId);
        listingId++;
        emit NFTListed(msg.sender, tokenId, price);
    }


    function buyNFTWithUSDC(uint256 listingId) public nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isListed, "This NFT is not for sale");
        require(paymentToken.balanceOf(msg.sender) >= listing.price, "Insufficient funds");
        require(paymentToken.allowance(msg.sender, address(this)) >= listing.price, "Marketplace not authorized to use the required funds");

        (address royaltyReceiver, uint256 royaltyAmount) = nftContract.royaltyInfo(listing.tokenId, listing.price);
        if (royaltyAmount > 0) {
            require(paymentToken.transferFrom(msg.sender, royaltyReceiver, royaltyAmount), "Royalty transfer failed");
        }

        require(paymentToken.transferFrom(msg.sender, listing.seller, listing.price - royaltyAmount), "Payment transfer failed");
        nftContract.safeTransferFrom(listing.seller, msg.sender, listing.tokenId, 1, "");
        listing.isListed = false;

        emit NFTSold(listing.seller, msg.sender, listing.tokenId, listing.price);
    }

    function purchaseSubscription(uint256 modelId, uint256 subscriptionId, uint256 duration) public nonReentrant {
        Model memory model = models[modelId];
        require(paymentToken.transferFrom(msg.sender, address(this), model.priceUSD), "Payment failed");
        uint256 tokenId = nftContract._encodeTokenId(modelId, subscriptionId);
        nftContract.mint(msg.sender, modelId, subscriptionId, 1, duration, model.royaltyFees, model.associatedAddress, "");
        
        emit SubscriptionPurchased(msg.sender, modelId, subscriptionId, tokenId);
    }

    function withdrawPayments(address beneficiary) external onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        require(balance > 0, "No funds available");
        require(paymentToken.transfer(beneficiary, balance), "Withdrawal failed");
    }

    function mintUnsafe(uint256 modelId, uint256 subscriptionId, uint256 duration, address user) public {
        Model memory model = models[modelId];
        uint256 tokenId = nftContract._encodeTokenId(modelId, subscriptionId);
        (address royaltyReceiver, uint256 royaltyAmount) = nftContract.royaltyInfo(tokenId, 1);
        nftContract.mint(user, modelId, subscriptionId, 1, duration, royaltyAmount,royaltyReceiver, "");
        
        emit SubscriptionPurchased(user, modelId, subscriptionId,tokenId);
    }

    function purchaseSubscriptionWithEth(uint256 modelId, uint256 subscriptionId, uint256 duration) external payable {
        Model memory model = models[modelId];
        uint256 priceInUsd = model.priceUSD;
        uint256 ethAmountRequired = usdToEth(priceInUsd);
        require(msg.value >= ethAmountRequired, "Insufficient ETH sent");

        uint256 tokenId = nftContract._encodeTokenId(modelId, subscriptionId);
        nftContract.mint(msg.sender, modelId, subscriptionId, 1, duration, model.royaltyFees, model.associatedAddress, "");
        
        emit SubscriptionPurchasedWithEth(msg.sender, modelId, subscriptionId, ethAmountRequired, tokenId);

        if (msg.value > ethAmountRequired) {
            payable(msg.sender).transfer(msg.value - ethAmountRequired);
        }
    }

    function fetchLatestPrice() public view returns (int) {
        (, int price,,,) = priceFeed.latestRoundData();
        return price;
    }

    function usdToEth(uint256 usdAmount) public view returns (uint256) {
        int price = fetchLatestPrice();
        require(price > 0, "Invalid price feed data");
        return (usdAmount * 1e18) / uint256(price);
    }

    function updatePaymentToken(address newPaymentTokenAddress) public onlyOwner {
        require(newPaymentTokenAddress != address(0), "Invalid address");
        paymentToken = IERC20(newPaymentTokenAddress);
    }

    function getOwnerAddress(uint256 _listingId) public view returns (address) {
        require(_listingId < listingId, "Listing does not exist");
        return listings[_listingId].seller;
    }

    function getOwnerByTokenId(uint256 tokenId) public view returns (address) {
        for (uint256 i = 0; i < listingId; i++) {
            if (listings[i].tokenId == tokenId && listings[i].isListed) {
                return listings[i].seller;
            }
        }
        revert("Token not listed");
    }

}