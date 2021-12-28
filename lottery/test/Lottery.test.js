const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { abi, evm } = require('../compile');

let lottery;
let accounts;

beforeEach( async()=>{
	accounts = await web3.eth.getAccounts();

	lottery = await new web3.eth.Contract(abi)
	.deploy({data: evm.bytecode.object})
	.send({ from: accounts[0], gas: '1000000' })
});

describe('Lottery Contract was deployed', () =>{
	it('Contract was deployed', () =>{
		assert.ok(lottery.options.address);
	});

    it('Allows one account to enter the lottery', async()=>{
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('0.02', 'ether')
		});

		const players = await lottery.methods.getPlayers().call({
			from:accounts[0]
		});
		assert.equal(accounts[0], players[0]);
		assert.equal(1, players.length);
	});

	it('It allows multiple accounts to enter', async()=>{
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('0.02', 'ether')
		});
		await lottery.methods.enter().send({
			from: accounts[1],
			value: web3.utils.toWei('0.02', 'ether')
		});
		await lottery.methods.enter().send({
			from: accounts[2],
			value: web3.utils.toWei('0.02', 'ether')
		});

		const players = await lottery.methods.getPlayers().call({
			from:accounts[0]
		});
		assert.equal(accounts[0], players[0]);
		assert.equal(accounts[1], players[1]);
		assert.equal(accounts[2], players[2]);
		assert.equal(3, players.length);
	});

	it('requires a minimum amount of ether to enter', async()=>{
		try{
			await lottery.methods.enter().send({
				from: account[0],
				value:200
			});
			assert(false);
		}catch(err){
			assert(err);
		}

	});

	it('only manager can call pickWinner', async() =>{
		try{
			await lottery.methods.pickWinner.send({
				from: account[1]
			});
			assert(false)
		} catch(e){
			assert(e);
		}
	});

	it('sends money to the winner and resests the players array', async()=>{
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('2', 'ether')
		});

		const initialBalance = await web3.eth.getBalance(accounts[0]);

		await lottery.methods.pickWinner().send({
			from: accounts[0]
		});
		const finalBalance = await web3.eth.getBalance(accounts[0]);
		const difference = finalBalance - initialBalance;

		assert(difference > web3.utils.toWei('1.8', 'ether'));
	});


	describe('After a winner has been picked', ()=>{
		beforeEach( async()=>{
			await lottery.methods.enter().send({
				from: accounts[1],
				value: web3.utils.toWei('1', 'ether')
			});
			await lottery.methods.enter().send({
				from: accounts[2],
				value: web3.utils.toWei('1', 'ether')
			});
			await lottery.methods.pickWinner().send({
				from: accounts[0]
			});
		});
	
		it('empty list after winner was selected', async()=>{
			const PlayersList = await lottery.methods.getPlayers().call({
				from: accounts[0]
				});
			assert.equal(0 , PlayersList.length)
		});

		it('No money in the balance after winner has been picked', async()=>{
			const balance = await web3.eth.getBalance(lottery.options.address);
			assert.equal(0, balance)

		})
	});
});