// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
contract MyToken is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    event TokenMinted( uint256 indexed tokenId, address owner);
    constructor(string memory name, string memory symbol) ERC721(name,symbol) {}
    function safeMint (
        address to,
        string memory tokenUri
    ) public onlyOwner returns (uint256) {
          _tokenIdCounter.increment();
        _safeMint(to, _tokenIdCounter.current());
        _setTokenURI(_tokenIdCounter.current(), tokenUri);
        emit TokenMinted(_tokenIdCounter.current(), to);
        return _tokenIdCounter.current();
    }
    function batchMint(
        address to,
        string[] memory tokenUriList,
        uint256 supply
    ) public onlyOwner returns (uint256 [] memory ){
        require(
            tokenUriList.length == supply,
            "supply & URIs length mismatch"
        );
        uint256[] memory tokenIds = new uint256[](supply);
        for (uint256 i = 0; i < supply; i++) {
            string memory data = tokenUriList[i];
            uint256 tokenId = safeMint(to, data);
            tokenIds[i] = tokenId;
        }
        return tokenIds;
    }


    // The following functions are overrides required by Solidity.
    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}