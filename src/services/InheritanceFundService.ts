import BN from 'bn.js';
import { Account, TransactionReceipt } from 'web3-core';
import { rootStore } from '../rootStore';
import { Addresses } from '../../contracts/addresses';
import Web3 from 'web3';

export const createPayroll = (web3: Web3) => async (
	fromAddress: string,
	controllerAccount: Account,
	recipientAddress: string,
	amount: BN,
	// Unix time (in seconds since epoch)
	startTime: BN,
	endTime: BN
) => {
	const toBN = web3.utils.toBN;

	const gasPrice = toBN(await web3.eth.getGasPrice()).mul(toBN(10)); // Speed up transactions
	const gasForSending = toBN(
		await web3.eth.estimateGas({
			from: fromAddress,
			to: controllerAccount.address
		})
	);
	const gasForApproval = toBN(
		await rootStore.currentState.contracts.erc20.methods
			.approve(Addresses.Sablier.MAINNET, amount.toString())
			.estimateGas()
	);
	const gasForERC20Transfer = toBN(
		await rootStore.currentState.contracts.erc20.methods
			.transfer(controllerAccount.address, amount.toString())
			.estimateGas()
	);
	const gasForStreamCreation = toBN(500000);
	// estimateGas doesn't work with web3 for createStream currently; seems to use about 250,000 gas
	//const gasForStreamCreation = await sablierContract.methods.createStream(recipientAddress, amount.toString(), Addresses.ERC20.MAINNET, startTime.toString(), endTime.toString()).estimateGas()

	const sendingTxFee = gasForSending.mul(gasPrice);
	const approvalTxFee = gasForApproval.mul(gasPrice);
	const ERC20TransferTxFee = gasForERC20Transfer.mul(gasPrice);
	const streamCreationTxFee = gasForStreamCreation.mul(gasPrice);
	const isApprovalNeeded = (
		await rootStore.currentState.contracts.erc20.methods
			.allowance(controllerAccount.address, Addresses.Sablier.MAINNET)
			.call()
	).lt(amount);
	const numTokensRequired = amount.sub(
		await rootStore.currentState.contracts.erc20.methods
			.balanceOf(controllerAccount.address)
			.call()
	);
	const areTokensRequired = numTokensRequired.gt(toBN(0));

	let controllerGasRequired = streamCreationTxFee;
	if (isApprovalNeeded)
		controllerGasRequired = controllerGasRequired.add(approvalTxFee);
	let totalGasRequired = controllerGasRequired.add(sendingTxFee);
	if (areTokensRequired)
		totalGasRequired = totalGasRequired.add(ERC20TransferTxFee);

	const senderBalance = toBN(await web3.eth.getBalance(fromAddress));
	if (senderBalance.lt(totalGasRequired)) {
		this.setState({
			errorNotification: "Don't have enough ETH for gas for both transactions"
		});
		this.setState({ processStatusState: 0 });
	}

	// Send gas to the controlling address if it needs it
	const controllerBalance = toBN(
		await web3.eth.getBalance(controllerAccount.address)
	);
	if (controllerBalance.lt(controllerGasRequired)) {
		const txFeeToSend = controllerGasRequired
			.sub(controllerBalance)
			.add(sendingTxFee);
		const gasSendTx = await web3.eth.sendTransaction({
			from: fromAddress,
			to: controllerAccount.address,
			value: txFeeToSend,
			gas: gasForSending.toString(),
			gasPrice: gasPrice
		});
	}
	// Approve the Sablier contract to spend the controller's tokens
	const approveTx = await rootStore.currentState.contracts.erc20.methods
		.approve(Addresses.Sablier.MAINNET, amount.toString())
		.send({
			from: controllerAccount.address,
			gas: gasForApproval.toString(),
			gasPrice: gasPrice
		});

	// Top up the controller's tokens to the requested amount
	const transferTx = await rootStore.currentState.contracts.erc20.methods
		.transfer(controllerAccount.address, numTokensRequired.toString())
		.send({
			from: fromAddress,
			gas: gasForERC20Transfer.toString(),
			gasPrice: gasPrice
		});

	// Create the Sablier stream.
	// Unfortunately, we can't pre-create this because the contract transfers all tokens immediately.
	// this.setState({ processStatusState: 4 });
	const streamCreateTx = await rootStore.currentState.contracts.sablier.methods
		.createStream(
			recipientAddress,
			amount.toString(),
			Addresses.ERC20.MAINNET,
			startTime.toString(),
			endTime.toString()
		)
		.send({
			from: controllerAccount.address
		})
		.on('receipt', receipt => {
			const streamId = receipt.events.CreateStream.returnValues.streamId;
			const transactionHash = streamCreateTx.transactionHash;
			return { streamId, transactionHash };
		});

	// this.setState({ processStatusState: 5 }); // Success
};

// class InheritanceFundService {
// 	constructor(
// 		public web3: Web3,
// 		public fromAddress: string,
// 		public controllerAccount: Account,
// 		public recipientAddress: string,
// 		public amount: BN,
// 		// Unix time (in seconds since epoch)
// 		public startTime: BN,
// 		public endTime: BN
// 	) {}

// 	private toBN = this.web3.utils.toBN;

// 	async sendPayroll() {
// 		const fees = await this.calculateTxFees();
// 		const numTokensRequired = this.amount.sub(
// 			await rootStore.currentState.contracts.erc20.methods
// 				.balanceOf(this.controllerAccount.address)
// 				.call()
// 		);
// 		const areTokensRequired = numTokensRequired.gt(this.toBN(0));
// 		const isApprovalNeeded = (
// 			await rootStore.currentState.contracts.erc20.methods
// 				.allowance(this.controllerAccount.address, Addresses.Sablier.MAINNET)
// 				.call()
// 		).lt(this.amount);
// 		let controllerGasRequired = fees.streamCreation;
// 		if (isApprovalNeeded)
// 			controllerGasRequired = controllerGasRequired.add(fees.approval);
// 		let totalGasRequired = controllerGasRequired.add(fees.approval);
// 		if (areTokensRequired)
// 			totalGasRequired = totalGasRequired.add(fees.tokenTransfer);

// 		const senderBalance = this.toBN(
// 			await this.web3.eth.getBalance(this.fromAddress)
// 		);
// 		if (senderBalance.lt(totalGasRequired)) {
// 			throw {
// 				errorNotification: "Don't have enough ETH for gas for both transactions"
// 			};
// 			// this.setState({ processStatusState: 0 });
// 		}

// 		// Send gas to the controlling address if it needs it
// 		const controllerBalance = this.toBN(
// 			await this.web3.eth.getBalance(this.controllerAccount.address)
// 		);
// 		if (controllerBalance.lt(controllerGasRequired)) {
// 			const txFeeToSend = controllerGasRequired
// 				.sub(controllerBalance)
// 				.add(fees.sending);
// 			const gasSendTx = await this.web3.eth.sendTransaction({
// 				from: this.fromAddress,
// 				to: this.controllerAccount.address,
// 				value: txFeeToSend,
// 				gas: fees.gas.gasForSending.toString(),
// 				gasPrice: fees.prices.gasPrice
// 			});
// 		}

// 		// this.setState({ processStatusState: 2 });
// 		if (isApprovalNeeded) {
// 			// Approve the Sablier contract to spend the controller's tokens
// 			const approveTx = await rootStore.currentState.contracts.erc20.methods
// 				.approve(Addresses.Sablier.MAINNET, amount.toString())
// 				.send({
// 					from: controllerAccount.address,
// 					gas: gasForApproval.toString(),
// 					gasPrice: gasPrice
// 				});
// 		}

// 		this.setState({ processStatusState: 3 });
// 		if (areTokensRequired) {
// 			// Top up the controller's tokens to the requested amount
// 			const transferTx = await rootStore.currentState.contracts.erc20.methods
// 				.transfer(controllerAccount.address, numTokensRequired.toString())
// 				.send({
// 					from: fromAddress,
// 					gas: gasForERC20Transfer.toString(),
// 					gasPrice: gasPrice
// 				});
// 		}

// 		// Create the Sablier stream.
// 		// Unfortunately, we can't pre-create this because the contract transfers all tokens immediately.
// 		this.setState({ processStatusState: 4 });
// 		const streamCreateTx = await rootStore.currentState.contracts.sablier.methods
// 			.createStream(
// 				recipientAddress,
// 				amount.toString(),
// 				Addresses.ERC20.MAINNET,
// 				startTime.toString(),
// 				endTime.toString()
// 			)
// 			.send({
// 				from: controllerAccount.address,
// 				gas: gasForStreamCreation.toString(),
// 				gasPrice: gasPrice
// 			})
// 			.on('receipt', receipt => {
// 				const streamId = receipt.events.CreateStream.returnValues.streamId;
// 				const transactionHash = streamCreateTx.transactionHash;
// 				return { streamId, transactionHash };
// 			});

// 		this.setState({ processStatusState: 5 }); // Success
// 	}

// 	async calculateTxFees() {
// 		const gasPrice = this.toBN(await this.web3.eth.getGasPrice()).mul(
// 			this.toBN(10)
// 		); // Speed up transactions
// 		const gasForSending = this.toBN(
// 			await this.web3.eth.estimateGas({
// 				from: this.fromAddress,
// 				to: this.controllerAccount.address
// 			})
// 		);
// 		const gasForApproval = this.toBN(
// 			await rootStore.currentState.contracts.erc20.methods
// 				.approve(Addresses.Sablier.MAINNET, this.amount.toString())
// 				.estimateGas()
// 		);
// 		const gasForERC20Transfer = this.toBN(
// 			await rootStore.currentState.contracts.erc20.methods
// 				.transfer(this.controllerAccount.address, this.amount.toString())
// 				.estimateGas()
// 		);
// 		const gasForStreamCreation = this.toBN(500000);
// 		// estimateGas doesn't work with web3 for createStream currently; seems to use about 250,000 gas
// 		//const gasForStreamCreation = await sablierContract.methods.createStream(recipientAddress, amount.toString(), Addresses.ERC20.MAINNET, startTime.toString(), endTime.toString()).estimateGas()

// 		const sending = gasForSending.mul(gasPrice);
// 		const approval = gasForApproval.mul(gasPrice);
// 		const tokenTransfer = gasForERC20Transfer.mul(gasPrice);
// 		const streamCreation = gasForStreamCreation.mul(gasPrice);
// 		return {
// 			sending,
// 			approval,
// 			tokenTransfer,
// 			streamCreation,
// 			gas: {
// 				gasForSending,
// 				gasForERC20Transfer,
// 				gasForStreamCreation,
// 				gasForApproval
// 			},
// 			prices: {
// 				gasPrice
// 			}
// 		};
// 	}
// }
