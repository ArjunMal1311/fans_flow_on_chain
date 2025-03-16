// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";

contract PurchaseSubscription {
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        string text,
        address token,
        uint256 tokenAmount,
        address feeToken,
        uint256 fees
    );

    // Custom errors to provide more descriptive revert messages.
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); // Used to make sure contract has enough balance to cover the fees.
    error NothingToWithdraw(); // Used when trying to withdraw Ether but there's nothing to withdraw.
    error FailedToWithdrawEth(address owner, address target, uint256 value); // Used when the withdrawal of Ether fails.
    error DestinationChainNotAllowed(uint64 destinationChainSelector); // Used when the destination chain has not been allowlisted by the contract owner.
    error SourceChainNotAllowed(uint64 sourceChainSelector); // Used when the source chain has not been allowlisted by the contract owner.
    error SenderNotAllowed(address sender); // Used when the sender has not been allowlisted by the contract owner.
    error InvalidReceiverAddress(); // Used when the receiver address is 0.

    bytes32 public s_lastRequestId;

    IRouterClient private s_router;

    LinkTokenInterface private s_linkToken;

    address public owner;
    IERC20 public stablecoin;
    AggregatorV3Interface public priceFeed;

    struct Subscription {
        uint256 modelId;
        uint256 subscriptionId;
        uint256 priceInUsd; // Price in USD
    }

    mapping(address => Subscription[]) public subscriptions;

    // Events
    event SubscribedWithToken(address indexed subscriber, uint256 modelId, uint256 subscriptionId, uint256 priceInUsd);
    event SubscribedWithNative(address indexed subscriber, uint256 modelId, uint256 subscriptionId, uint256 ethAmount);


    constructor(address _router, address _link, address _stablecoinAddress, address _priceFeedAddress) {
        stablecoin = IERC20(_stablecoinAddress);
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        s_router = IRouterClient(_router);
        s_linkToken = LinkTokenInterface(_link);
    }

    function subscribeWithToken(uint256 modelId, uint256 subscriptionId, uint256 priceInUsd) external {
        require(stablecoin.transferFrom(msg.sender, address(this), priceInUsd), "Transfer failed");
        Subscription memory newSubscription = Subscription({
            modelId: modelId,
            subscriptionId: subscriptionId,
            priceInUsd: priceInUsd
        });
        subscriptions[msg.sender].push(newSubscription);
        emit SubscribedWithToken(msg.sender, modelId, subscriptionId, priceInUsd);
    }

    function subscribeWithNative(uint256 modelId, uint256 subscriptionId, uint256 priceInUsd) external payable {
        uint256 nativeAmountRequired = usdcToNative(priceInUsd);
        require(msg.value >= nativeAmountRequired, "Insufficient ETH sent");

        Subscription memory newSubscription = Subscription({
            modelId: modelId,
            subscriptionId: subscriptionId,
            priceInUsd: priceInUsd
        });
        subscriptions[msg.sender].push(newSubscription);
        emit SubscribedWithNative(msg.sender, modelId, subscriptionId, msg.value);

        // Refund any excess ETH sent
        if (msg.value > nativeAmountRequired) {
            payable(msg.sender).transfer(msg.value - nativeAmountRequired);
        }
    }

    function fetchLatestPrice() public view returns (int) {
        (, int price,,,) = priceFeed.latestRoundData();
        return price;
    }

    function usdcToNative(uint256 usdAmount) public view returns (uint256) {
        int price = fetchLatestPrice();
        require(price > 0, "Invalid price feed data");
        return (usdAmount * 1e18) / uint256(price);
    }

    function sendUsdcCrossChainNFTMint(uint64 _destinationChainSelector, address _receiver, uint256 modelId, uint256 subscriptionId, uint256 duration, uint256 _amount) external returns (bytes32 messageId) {
        require(stablecoin.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        address user = msg.sender;
        bytes memory data = abi.encode(modelId, subscriptionId, user, duration);

        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            data,
            address(stablecoin),
            _amount,
            address(s_linkToken)
        );

        uint256 fees = s_router.getFee(_destinationChainSelector, evm2AnyMessage);
        if (fees > s_linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);

        s_linkToken.approve(address(s_router), fees);
        stablecoin.approve(address(s_router), _amount);

        messageId = s_router.ccipSend(_destinationChainSelector, evm2AnyMessage);

        emit MessageSent(
            messageId,
            _destinationChainSelector,
            _receiver,
            "Initiating Subscription Purchase",
            address(stablecoin),
            _amount,
            address(s_linkToken),
            fees
        );

        return messageId;
    }

    function _buildCCIPMessage(address _receiver, bytes memory data, address _token, uint256 _amount, address _feeTokenAddress) private pure returns (Client.EVM2AnyMessage memory) {
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: _token,
            amount: _amount
        });

        return Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: data,
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000})),
            feeToken: _feeTokenAddress
        });
    }

}