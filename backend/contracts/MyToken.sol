// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "@openzeppelin/contracts@4.4.1/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts@4.4.1/access/Ownable.sol";
import "@openzeppelin/contracts@4.4.1/token/ERC1155/extensions/ERC1155Burnable.sol";
contract MyToken is ERC1155, Ownable, ERC1155Burnable {
    constructor(string memory _name) ERC1155(_name) {}
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyOwner
    {
        _mint(account, id, amount, data);
    }
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyOwner
    {
        _mintBatch(to, ids, amounts, data);
    }
}