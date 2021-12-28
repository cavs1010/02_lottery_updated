// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

contract Lottery{
    address public manager;
    address [] public players;
    address public lastWinner;

    constructor(){
        manager = msg.sender;
    }

    function enter() public payable{
        require(msg.value > 0.00001 ether);
        players.push(msg.sender);
    }

    function random() private view returns (uint){
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }

    function pickWinner() public restricted{
        uint index = random() % players.length;
        payable(players[index]).transfer(address(this).balance);
        lastWinner = players[index];
        players = new address[](0);
    }

    function getPlayers() public view returns(address[] memory){
        return players;
    }

    modifier restricted(){
        require(msg.sender == manager);
        _;
    }

}