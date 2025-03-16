// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";


contract Avatar is ERC1155, FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    bytes32 public s_lastRequestId; // stores tge request id for tracking chainlink function requests
    bytes public s_lastResponse; // holds the response from the chainlink function
    bytes public s_lastError; // holds the error from the chainlink function
    string public lastIpfsUri; // holds the ipfs uri from the chainlink function


    error UnexpectedRequestID(bytes32 requestId);
    event UnexpectedRequestIDError(bytes32 indexed requestId);
    event DecodingFailed(bytes32 indexed requestId);
    event ResponseError(bytes32 indexed requestId, bytes err);

    address router = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;
    string source = 
        "const name = args[0];"
        "const description = 'Welcome to BlockTease, with this NFT you gain access to our exclusive content! Enjoy (:';"
        "const createNFT_genMetadata_URL = '';"
        "console.log(`HTTP POST Request to ${createNFT_genMetadata_URL}`);"
        "const nftRequest = Functions.makeHttpRequest({"
        "url: createNFT_genMetadata_URL,"
        "method: 'POST',"
        "headers: {"
        "    'Content-Type': 'application/json'"
        "},"
        "timeout: 9000,"
        "data: {"
        "    name,"
        "    description"
        "}"
        "});"
        "const nftResponse = await nftRequest;"
        "console.log(`Pin metadata for NFT with name: ${name}`);"
        "if (nftResponse.error) {"
        "    console.error("
        "        nftResponse.response"
        "            ? `${nftResponse.response.status},${nftResponse.response.statusText}`"
        "            : 'An unknown error occurred'"
        "    );"
        "    throw Error('Request failed');"
        "}"
        "const nftData = nftResponse.data;"
        "if (!nftData) {"
        "    throw Error('Failed to receive data from the server');"
        "}"
        "console.log('NFT Metadata Response', nftData);"
        "console.log(nftData.metadataIPFSUrl);"
        "return Functions.encodeString(nftData.metadataIPFSUrl);";


    // donID - Hardcoded for Avalanche Fuji
    bytes32 donID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;
    uint256 private _tokenId;
    event Response(bytes32 indexed requestId, string response, bytes err);
    mapping(uint256 => string) public _tokenURIs;

    constructor() ERC1155("") FunctionsClient(router) ConfirmedOwner(msg.sender) {}

    function sendRequest( uint64 subscriptionId, string[] calldata args, uint32 gasLimit) public returns (bytes32 requestId) {
        _mint(msg.sender, _tokenId, 1, "0x");
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (args.length > 0) req.setArgs(args);
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );
        return s_lastRequestId;
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (s_lastRequestId != requestId) {
            emit Response(requestId, string(response), err); 
            return;
        }
        s_lastResponse = response;
        s_lastError = err;
        lastIpfsUri = string(response);
        _tokenURIs[_tokenId]=lastIpfsUri;
        _tokenId++;
        emit Response(requestId, lastIpfsUri, s_lastError);
        
    }

    function setURI(uint256 tokenId, string memory newuri) public {
        _tokenURIs[tokenId] = newuri;
        emit URI(newuri, tokenId);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data, string memory tokenURI) public {
        _mint(account, id, amount, data);
        setURI(id, tokenURI);
    }

    function getTokenId() public view returns(uint256){
        return _tokenId;
    }
}