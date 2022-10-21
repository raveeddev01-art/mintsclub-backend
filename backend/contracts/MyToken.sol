// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MinterC is ERC1155URIStorage , ReentrancyGuard 
{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;


    constructor(string memory _name) ERC1155("")
    {
        name = _name ;
    }

    string public name;
    string private _baseURI = "";
    uint256 public currentNFTLimit = 100;

    mapping(uint256=> bool) isTransferred ;
    mapping(uint256 => string)  private _tokenURIs;

    function ChangeNFTAmountLimit(uint256 _amount) nonReentrant public returns (uint256)
    {
        require(msg.sender == 0xC3D983C37C12B9eeA18af467ee5b5e388bf031CE , "you are not autherized to change amount of nft coppies");
        currentNFTLimit = _amount;
        return currentNFTLimit; 
    }

    function mint(address account , uint256 amount , string memory tokenuri) nonReentrant public 
    {
        require(amount <= currentNFTLimit , "can not create coppies more than 100");
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _mint(account,tokenId,amount,"0x00");
        _setURI(tokenId, tokenuri);
    }

    function mintBatch(address to, uint256[] memory amounts, string[] memory tokenUris) nonReentrant public
    {
        require(tokenUris.length == amounts.length , "Ids and TokenUri length mismatch");
        uint[] memory tokenId = new uint[](amounts.length);
        for (uint i = 0; i < amounts.length; i++){
            _tokenIdCounter.increment();
            tokenId[i] = _tokenIdCounter.current();
            _setURI(tokenId[i], tokenUris[i]);
        }
         _mintBatch(to, tokenId, amounts, "0x00");
             
    }
     function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override nonReentrant {
        super.safeTransferFrom(from, to, id, amount, data);
        isTransferred[id] = true;

    }

    function safeBatchTransferFrom (
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override nonReentrant {
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
       for(uint256 i = 0; i< ids.length; i++){
           isTransferred[ids[i]]= true;
       }
        
    }

     function EditNFTUri(uint256 tokenId, string memory newUri) public nonReentrant {
         
        require(super.balanceOf(msg.sender,tokenId)!= 0, "Only NFT Owner can Edit");
        require(isTransferred[tokenId] == false,"you cannot change metadata now");
        _setURI(tokenId, newUri);
    }

    // Read functions needs to added if needed
    
}