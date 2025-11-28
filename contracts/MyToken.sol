// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
        Ownable(msg.sender) // OZ v5: 需要把初始 owner 传给 Ownable
    {}

    /// @notice 仅 owner 可铸造
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
//可以写一个mint 2：to可能是一个list，amount也是一个list