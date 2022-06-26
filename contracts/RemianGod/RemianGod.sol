// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../Household/Household.sol";
import "../Household_Interface/IHousehold.sol";

contract RemianGod is Ownable {
    event Create(address sender, string location, uint256 time);
    event AddFirstMember(address sender, address household, address addedMember, string role, uint256 time);
    event DistrainHoushold(address sender, address addedMember, uint256 time);

    // stores the list of household smart contract addresses
    Household[] public households;

    /**
     * @notice creates a new household smart contract
     * @param _usd defines the stablecoin to be used as a medium to pay the utility bills
     * @param _location stores the unit number of the apartment
     * @param _amount defines the fixed monthly utility amount
     * @dev Reverts if the sender is not the owner
     */
    function create(address _usd, string memory _location, uint256 _amount) public {
        Household household = new Household(_usd, _location, _amount);
        households.push(household);
        emit Create(msg.sender, _location, block.timestamp);
    }

    /**
     * @notice defines the first member of the specific household
     * @param _household household address stored in this smart contract
     * @param _member the address of the first member to be declared
     * @param _role defining the member's role
     * @dev Reverts if the sender is not the owner
     */
    function addFirstMember(address _household, address _member, string memory _role) external onlyOwner {
        IHousehold(_household).addMember(_member, _role);
        emit AddFirstMember(msg.sender, _household, _member, _role, block.timestamp);
    }

    /**
     * @notice checks the liabities of the specific houshold
     * @param _household household address stored in this smart contract
     * @dev Reverts if the sender is not the owner
     */
    function checkLiabilities(address _household) public view onlyOwner returns (uint256) {
        return IHousehold(_household).checkLiabilities();
    }

    /**
     * @notice distrains the household and destroys the smart contract. 
     * @notice the remaining funds are transferred to this contract
     * @param _household household address stored in this smart contract
     * @dev Reverts if the sender is not the owner
     */
    function distrainHousehold(address _household) external onlyOwner {
        IHousehold(_household).distrainHousehold();
        emit DistrainHoushold(msg.sender, _household, block.timestamp);
    }
}