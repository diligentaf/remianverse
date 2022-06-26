// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IHousehold {
    function addMember(address, string memory) external;

    function distrainHousehold() external;

    function checkLiabilities() external view  returns (uint256) ;
}
