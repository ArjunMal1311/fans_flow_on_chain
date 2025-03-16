// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./nft.sol";

// Why are we using ERC1155?
// 1. multi token (both fungible and non fungible)
// 2. lower cost (batch transfer reduce the gas fee)
// if we need to send multiple different ERC-20 tokens then 5 seperate transactions are required thereby higher gas fees
// ERC-1155 (✅ Supported, multiple tokens in one transfer). ERC-1155 lets you send multiple tokens in one transaction.
// If you want to send 100 gold coins + 2 swords + 1 shield, you can do it in a single transaction.

// 3. each token can have unique metadata
// 4. single contract to manage all tokens

contract MarketPlace is ReentrancyGuard, Ownable {
    NFT private nftContract;
    IERC20 public paymentToken;
    uint256 private _listingId;  // Counter for unique listing IDs

    struct Model {
        uint256 priceUSD;  // Price per subscription in USD
        address associatedAddress;  // address, can be used for royalties or creator info
        uint256 royaltyFees; // basis points (e.g., 500 for 5%)
    }

    struct Listing {
        uint256 price;
        address seller;
        bool isListed;
        uint256 tokenId;
    }

    mapping(uint256 => Listing) public listings; // tokenId => Listing
    mapping(uint256 => Model) public models;

    event SubscriptionPurchased(address indexed buyer, uint256 modelId, uint256 subscriptionId, uint256 tokenId);
    event ModelUpdated(uint256 modelId, uint256 priceUSD, address associatedAddress, uint256 royaltyFee);
    event NFTListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event NFTSold(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 price);

    constructor(address _nftContract, address _paymentToken) Ownable(msg.sender) {
        nftContract = NFT(_nftContract);
        paymentToken = IERC20(_paymentToken);
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
        
        listings[_listingId] = Listing(price, msg.sender, true, tokenId);
        _listingId++;  
        emit NFTListed(msg.sender, tokenId, price);
    }

    function buyNFT(uint256 listingId) public payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isListed, "This NFT is not for sale");
        require(msg.value >= listing.price, "Insufficient funds sent");

        (address royaltyReceiver, uint256 royaltyAmount) = nftContract.royaltyInfo(listing.tokenId, listing.price);
        if (royaltyAmount > 0) {
            payable(royaltyReceiver).transfer(royaltyAmount);
            payable(listing.seller).transfer(listing.price - royaltyAmount);
        } else {
            payable(listing.seller).transfer(listing.price);
        }

        nftContract.safeTransferFrom(listing.seller, msg.sender, listing.tokenId, 1, "");

        listing.isListed = false;

        emit NFTSold(listing.seller, msg.sender, listing.tokenId, listing.price);
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

    function getTotalListingIds() public view returns (uint256) {
        return _listingId;
    }
}