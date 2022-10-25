// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";



contract Minting is ERC1155URIStorage , ReentrancyGuard
{
    using SafeMath for uint256;
    uint256 public latestTokenID;
    address public mclubmintaddress ;

    function getMCaddress() external view returns(address _contractaddress)
    {
        return mclubmintaddress ;

    }


    constructor(string memory _name) ERC1155("")
    {
        name = _name ;
        mclubmintaddress = address(this);
    }

    string public name;
    string private _baseURI = "";
    uint256 public currentNFTLimit = 100;

    struct MintingDatails
    {
        bool valid;    
        uint256 tokenId;
        uint256 nftcoppies;
        uint256 royaltyFee;
        address minter;
        address nftAddress;
    }

    mapping(uint256 => bool) isTransferred ;
    mapping(uint256 => string)  private _tokenURIs;
    mapping(uint256 => MintingDatails) public minterdetails;

    function  validateMinter(address _address , uint256 _tokenId)  external view returns (address _minter) 
    {
        if(_address == minterdetails[_tokenId].minter && minterdetails[_tokenId].valid == true )
        {
          return _address;
        }
        else{
            revert ("invalid address");
        }   
    }

    function getRoyaltyInPBP(uint256 _tokenId) public view returns (uint256 _fee)
    {
        if(_tokenId == minterdetails[_tokenId].tokenId && minterdetails[_tokenId].valid == true)
        {
            return minterdetails[_tokenId].royaltyFee;
        }   
        
        
    }

    function gminter(address _nftaddress , uint256 _tokenId) external view  returns (address _minteraddress) {
        if(_nftaddress == minterdetails[_tokenId].nftAddress && minterdetails[_tokenId].valid == true){
            return minterdetails[_tokenId].minter;
        }
        else
        {
            revert ("reverted invalid address");
        }  
    }

    event mints(uint256 indexed tokenid , uint256 indexed amount , address indexed minter);
    event lazymints(uint256 indexed tokenid , uint256 indexed amount , address indexed minter , address lazyminter , uint256 amountPaid);
    event mintBatched(uint256[] indexed tokenid , uint256[] indexed amount , address indexed minter);
    
    
    function ChangeNFTAmountLimit(uint256 _amount) nonReentrant public returns (uint256)
    {
        require(msg.sender == 0xC3D983C37C12B9eeA18af467ee5b5e388bf031CE , "you are not autherized to change amount of nft coppies");
        currentNFTLimit = _amount;
        return currentNFTLimit; 
    }

    function mint(address account , uint256 tokenId , uint256 amount , string memory tokenuri , uint256 _royaltyFee)  nonReentrant public 
    {

        latestTokenID = tokenId;
        require(amount <= currentNFTLimit , "can not create coppies more than 100");
        require(_royaltyFee >= 150 && _royaltyFee <= 2000 , "Royalties  can't be greater than 20% ");
        _mint(account,tokenId,amount,"0x00");
        _setURI(tokenId, tokenuri);

        minterdetails[tokenId].valid = true; 
        minterdetails[tokenId].tokenId = tokenId; 
        minterdetails[tokenId].nftcoppies = amount; 
        minterdetails[tokenId].minter = account; 
        minterdetails[tokenId].nftAddress = address(this); 
        minterdetails[tokenId].royaltyFee = _royaltyFee;

        emit mints(tokenId,amount,account);
    }


   

    function Lazymint(address account , uint256 tokenId , uint256 amount , address lazyMinter ,string memory tokenuri) nonReentrant public payable
    {
        latestTokenID = tokenId;

        require(msg.value > 0, "0 price is not allowed");
        require(amount <= currentNFTLimit , "can not create coppies more than 100");
        _mint(account,tokenId,amount,"0x00");
        _setURI(tokenId, tokenuri);
        payable(lazyMinter).transfer(msg.value);
        emit lazymints(tokenId,amount,account,lazyMinter,msg.value);
    }

    function mintBatch(address to, uint[] memory tokenId , uint256[] memory amounts, string[] memory tokenUris) nonReentrant public
    {
        require(tokenUris.length == amounts.length , "Ids and TokenUri length mismatch");
        for (uint i = 0; i < amounts.length; i++){
            _setURI(tokenId[i], tokenUris[i]);
        }
         _mintBatch(to, tokenId, amounts, "0x00");
    
        emit mintBatched(tokenId,amounts,to);

             
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