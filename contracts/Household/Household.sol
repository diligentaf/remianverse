// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Household {

    event AddMember(address sender, address addedMember, uint256 time);
    event RemoveMember(address sender, address addedMember, uint256 time);
    event FundUtilities(address sender, uint256 time, uint256 amount);
    event WithdrawFund(address sender, uint256 time, uint256 amount);
    event PayUtilityBill(address sender, uint256 time, uint256 amount);

    uint256 private balance;
    uint256 private timestamp;
    uint256 monthlyAmount;
    // Household address
    string public location;
    // Remian God's address
    address private god;
    // household member's list
    address[] private members;

    // user address => member index
    mapping(address => uint256) indexOf;
    // user address => checks whether address is a household member
    mapping(address => bool) inserted;
    // user address => checks the role
    mapping(address => bytes32) role;

    // stablecoin address
    IERC20 immutable usd;

    // defining member roles
    bytes32 private constant KING_ROLE = keccak256("KING_ROLE");
    bytes32 private constant BISHOP_ROLE = keccak256("BISHOP_ROLE");
    bytes32 private constant PUN_ROLE = keccak256("PUN_ROLE");

    constructor(address _usd, string memory _location, uint256 _amount) {
        god = msg.sender;
        usd = IERC20(address(_usd));
        timestamp = block.timestamp;
        location = _location;
        monthlyAmount = _amount;
    }

    /**
     * @notice adding member can only be done by other members
     * @param _member member to be added
     * @param _role role to be assigned
     * @dev Reverts if the sender is not a member
     */
    function addMember(address _member, string memory _role) external onlyMember {
        role[_member] = keccak256(abi.encodePacked(_role));
        indexOf[_member] = members.length;

        if (!inserted[_member]) {
            inserted[_member] = true;
            members.push(_member);
        }
        emit AddMember(msg.sender, _member, block.timestamp);
    }

    /**
     * @notice removing member can only be done by other bishop(s)
     * @param _member member to be added
     * @dev Reverts if the sender is not a bishop
     */
    function removeMember(address _member) public onlyBishop {
        require(inserted[_member], "member does not exist");
        require(role[_member] == PUN_ROLE, "king or bishop cannot be removed");

        members[indexOf[_member]] = members[members.length - 1];
        delete indexOf[_member];
        delete inserted[_member];
        delete role[_member];
        members.pop();
        emit RemoveMember(msg.sender, _member, block.timestamp);
    }

    /**
     * @notice funding utilities can only be done by other members
     * @param _fundingAmount amount to be added to the fund
     * @dev Reverts if the sender is not a member
     */
    function fundUtilities(uint256 _fundingAmount) public onlyMember {
        require(
            usd.transferFrom(msg.sender, address(this), _fundingAmount),
            "Stablecoin funding failed"
        );
        balance += _fundingAmount;
        emit FundUtilities(msg.sender, block.timestamp, _fundingAmount);
    }

    /**
     * @notice withdrawing fund can only be done by other king(s)
     * @dev Reverts if the current smart contract lacks with funds
     * @param _amount amount to be added to the fund
     * @dev Reverts if the sender is not a king
     */
    function withdrawFund(uint256 _amount) public payable onlyKing {
        require(balance >= _amount, "not enough fund in the contract");
        require(
            usd.transfer(msg.sender, _amount),
            "Stablecoin transfer failed"
        );
        balance -= _amount;
        emit WithdrawFund(msg.sender, block.timestamp, _amount);
    }

    /**
     * @notice paying utility bill can only be done by other king(s)
     * @dev Reverts if the current smart contract lacks with funds
     * @dev Reverts if the sender is not a king
     */
    function payUtilityBill() public payable onlyKing {
        require(balance >= monthlyAmount, "not enough fund in the contract");
        require(
            usd.transfer(address(god), monthlyAmount),
            "Stablecoin transfer failed"
        );
        balance -= monthlyAmount;
        timestamp += 30 days;
        emit PayUtilityBill(msg.sender, block.timestamp, monthlyAmount);
    }

    /**
     * @notice Returns the number of members in the household
     */
    function getSize() external view onlyMember returns (uint256) {
        return members.length;
    }

    /**
     * @notice Returns the role of the member if the user is part of the household
     */
    function getRole(uint256 _i) external view onlyMember returns (bytes32) {
        return role[members[_i]];
    }

    /**
     * @notice checking whether unpaid liabilities exists
     * @dev Reverts if the household paid utility bills in advance
     */
    function checkLiabilities() public view onlyMember returns (uint256) {
        require(block.timestamp > timestamp, "the household paid in advance");
        return (block.timestamp - timestamp) / 30 days;
    }

    /**
     * @notice Distraint for household which hasn't paid the utilities for the past 6 months 
     * @dev Reverts if the household paid utility bills in advance
     * @dev Reverts if the incurred liabilities are less than 6 months
     */
    function distrainHousehold() external payable onlyGod {
        require(block.timestamp > timestamp, "the household paid in advance");
        require(6 >= (block.timestamp - timestamp) / 30 days, "liabilities not enough to distrain");
        require( usd.transfer(address(god), usd.balanceOf(address(this))), "Stablecoin transfer failed");
        selfdestruct(payable(address(god)));
    }

    /**
     * @notice Checks if the role is king
     */
    modifier onlyKing() {
        require(role[msg.sender] == KING_ROLE, "not a king");
        _;
    }

    /**
     * @notice Checks if the role is bishop
     */
    modifier onlyBishop() {
        require(role[msg.sender] == BISHOP_ROLE, "not a bishop");
        _;
    }

    /**
     * @notice Checks if the role is member or god
     */
    modifier onlyMember() {
        require(msg.sender == address(god) || inserted[msg.sender], "not a member");
        _;
    }

    /**
     * @notice Checks if the role is god
     */
    modifier onlyGod() {
        require(msg.sender == address(god), "not a god");
        _;
    }
}