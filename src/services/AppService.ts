import { rootStore } from '../rootStore';
import { Sablier } from '../../contracts/types/Sablier';
import { Addresses } from '../../contracts/addresses';
// @ts-ignore
import SABLIER_ABI from '../../contracts/abis/Sablier.json';
// @ts-ignore
import ERC20_ABI from '../../contracts/abis/ERC20.json';
import { AbiItem } from 'web3-utils/types/index';
import { ERC20 } from '../../contracts/types/ERC20';
import { MouseEntropy } from '../utils/MouseEntropy';
import Web3 from 'web3';
import { Account } from 'web3-core';
import BN from 'bn.js';
import { ApproveSablier } from '../sablier/transactions/ApproveSablier';
import { CheckSablierAllowance } from '../sablier/transactions/CheckSablierAllowance';
import { CreateSablierStream } from '../sablier/transactions/CreateSablierStream';
import {
	TransactionWrapper,
	TransactionPrices
} from '../sablier/transactions/TransactionWrapper';
import { ERC20TokenInfo } from '../utils/Erc20Data';
import BigNumber from 'bignumber.js';
BigNumber.config({ EXPONENTIAL_AT: 100 });

export class AppService {
	readonly cryptoKey = 'insecure-encryption-key-for-obfuscuation' as const;
	readonly localStorageKey = 'throwaway-private-key' as const;

	async transferFundsToThrowawayAddress() {
		const service = this;
		const state = rootStore.currentState;
		console.log('loading metamask client');
		const metamask = await service.loadMetamaskClient();
		const { totalFees } = await this.estimateTransactionSequenceCosts(
			await this.createTransactionSequence()
		);
		console.log('loaded metamask client');
		if (new BN(state.throwawayWalletWeiBalance).lt(totalFees)) {
			const weiToSend = totalFees.sub(new BN(state.throwawayWalletWeiBalance));
			const tx = {
				to: state.throwawayWallet.address,
				value: weiToSend.toString()
			};
			await metamask.sendTransaction(tx);
		}
		const machineReadableTokenQuantity = this.calculateMachineReadableTokenQuantity(
			rootStore.currentState.sablierHumanReadableTokenDepositQuantity,
			rootStore.currentState.erc20Token.decimals
		);
		if (
			new BN(state.throwawayWalletERC20TokenBalance).lt(
				new BN(machineReadableTokenQuantity)
			)
		) {
			const tokensToSend = new BN(machineReadableTokenQuantity)
				.sub(new BN(state.throwawayWalletERC20TokenBalance))
				.toString();
			const erc20TransferTxObject = service.contracts.ERC20TokenContract.methods.transfer(
				state.throwawayWallet.address,
				tokensToSend
			);
			await metamask.sendTransaction({
				data: erc20TransferTxObject.encodeABI(),
				to: state.erc20Token.address
			});
		}
	}
	async estimateTransactionSequenceCosts(
		sequence: TransactionWrapper<any, any, any>[]
	) {
		// const sequence = await this.createTransactionSequence();
		let totalGas: BN = new BN(0);
		let totalFees: BN = new BN(0);
		// to speed up transactions
		const gasPriceModifier = 5;
		const gasPriceIntStr = await this.web3.eth.getGasPrice();
		const gasPriceModified = new BigNumber(gasPriceIntStr)
			.multipliedBy(new BigNumber(gasPriceModifier))
			.toString();
		const gasPrice = new BN(gasPriceModified);
		const allCosts: TransactionPrices[] = [];
		for (let tx of sequence) {
			const costs = await tx.estimateTxCosts({
				gasPrice
			});
			allCosts.push({
				gas: costs.gas.toString(),
				gasPrice: costs.gasPrice.toString()
			});
			totalGas = totalGas.add(costs.gas);
			totalFees = totalGas.add(costs.fee);
		}
		return {
			allCosts,
			totalFees,
			totalGas,
			gasPrice
		};
	}
	async createTransactionSequence() {
		const startDateTimeUnix = this.dateToUnix(
			new Date(rootStore.currentState.sablierStartDate)
		);
		const endDateTimeUnix = this.dateToUnix(
			new Date(rootStore.currentState.sablierEndDate)
		);
		const sablierTokenDepositQuantity = this.calculateNearestValidSablierDepositAmount(
			rootStore.currentState.sablierHumanReadableTokenDepositQuantity,
			new Date(startDateTimeUnix * 1000),
			new Date(endDateTimeUnix * 1000),
			rootStore.currentState.erc20Token
		);
		const sablierAllowance = await new CheckSablierAllowance(
			this.web3,
			this.contracts.ERC20TokenContract,
			{
				walletAddress: rootStore.currentState.throwawayWallet.address
			}
		).invokeTx();
		const amountToApprove = new BN(sablierTokenDepositQuantity).sub(
			new BN(sablierAllowance)
		);
		const needsApproval = amountToApprove.gte(new BN(0));
		console.log({ needsApproval });
		console.log({ amountToApprove: amountToApprove.toString() });
		let sequence = [
			...(needsApproval
				? [
						new ApproveSablier(this.web3, this.contracts.ERC20TokenContract, {
							amountOfTokenToApprove: sablierTokenDepositQuantity,
							fromAddress: rootStore.currentState.throwawayWallet.address
						})
				  ]
				: []),
			new CreateSablierStream(this.web3, this.contracts.SablierContract, {
				startDateTimeUnix,
				endDateTimeUnix,
				recipientAddress: rootStore.currentState.sablierReceivingAddress,
				fromAddress: rootStore.currentState.throwawayWallet.address,
				tokenQuantity: sablierTokenDepositQuantity,
				tokenContractAddress: rootStore.currentState.erc20Token.address
			})
		];
		return sequence;
	}
	calculateMachineReadableTokenQuantity(
		humanReadableTokenQuantity: string | number,
		decimals: string | number
	): string {
		return new BigNumber(humanReadableTokenQuantity)
			.multipliedBy(new BigNumber(10).pow(new BigNumber(decimals)))
			.toFixed(0);
	}
	calculateHumanReadableTokenQuantity(
		machineReadableTokenQuantity: string | number,
		decimals: string | number
	): string {
		return new BigNumber(machineReadableTokenQuantity)
			.div(new BigNumber(10).pow(new BigNumber(decimals)))
			.toString();
	}
	get web3() {
		return rootStore.currentState.web3;
	}

	async init() {
		const promise = (async () => {
			MouseEntropy.start();
			const web3 = await this.loadWeb3();
			rootStore.dispatch(['SET_WEB3', web3]);
			this.loadThrowawayWallet();
			this.liveUpdatethrowawayWalletBalance();
		})();
		this.init = () => promise;
		return promise;
	}

	get humanReadableEtherBalance() {
		const balance = rootStore.currentState.throwawayWalletWeiBalance;
		return balance == '0'
			? '0'
			: [
					[+1e18, 'Ether'],
					[+1e9, 'Gwei'],
					[+1, 'Wei']
			  ]
					.filter(([portion, name]) => +balance / +portion >= 1)
					.map(pair => +balance / +pair[0] + ' ' + pair[1])
					.shift();
	}

	get humanReadableTokenBalance() {
		return rootStore.currentState.throwawayWalletERC20TokenBalance +
			' ' +
			rootStore.currentState.erc20Token
			? rootStore.currentState.erc20Token.name
			: 'Tokens';
	}

	tryLoadWalletFromStorage(): Account | null {
		const storedEncryptedWalletRaw = window.localStorage.getItem(
			this.localStorageKey
		);
		if (storedEncryptedWalletRaw) {
			try {
				const parsedWallet = JSON.parse(storedEncryptedWalletRaw);
				return this.web3.eth.accounts.decrypt(parsedWallet, this.cryptoKey);
			} catch (e) {
				debugger;
			}
			debugger;
		}
		debugger;
		return null;
	}
	tryGenerateWallet(): Account {
		const throwawayWallet = this.web3.eth.accounts.create(
			this.web3.utils.randomHex(32) + MouseEntropy.entropy
		);
		const obsfucatedAccount = this.web3.eth.accounts.encrypt(
			throwawayWallet.privateKey,
			this.cryptoKey
		);
		window.localStorage.setItem(
			this.localStorageKey,
			JSON.stringify(obsfucatedAccount)
		);
		return throwawayWallet;
	}
	loadThrowawayWallet() {
		let account = this.tryLoadWalletFromStorage();
		if (!account) {
			debugger;
			account = this.tryGenerateWallet();
		}
		this.web3.eth.accounts.wallet.add(account);
		rootStore.dispatch(['SET_THROWAWAY_WALLET', account]);
	}

	get contracts() {
		const web3 = rootStore.currentState.web3;
		const { throwawayWallet, erc20Token } = rootStore.currentState;
		const sablierContract: Sablier | null = throwawayWallet
			? new web3.eth.Contract(
					(SABLIER_ABI as unknown) as AbiItem,
					Addresses.Sablier.select()
					// {
					// 	from: throwawayWallet.address
					// }
			  )
			: null;

		const erc20Contract: ERC20 | null =
			erc20Token && throwawayWallet
				? new web3.eth.Contract(
						(ERC20_ABI as unknown) as AbiItem,
						erc20Token.address
						// {
						// 	from: throwawayWallet.address
						// }
				  )
				: null;
		return {
			ERC20TokenContract: erc20Contract,
			SablierContract: sablierContract
		};
	}

	async updateThrowawayWalletBalance() {
		try {
			if (rootStore.currentState.throwawayWallet) {
				const balance = await rootStore.currentState.web3.eth.getBalance(
					rootStore.currentState.throwawayWallet.address
				);
				if (balance != rootStore.currentState.throwawayWalletWeiBalance) {
					rootStore.dispatch(['SET_THROWAWAY_WALLET_ETHER_BALANCE', balance]);
				}
			}
			const Erc20Contract = this.contracts.ERC20TokenContract;
			if (Erc20Contract) {
				const erc20TokenBalance = await Erc20Contract.methods
					.balanceOf(rootStore.currentState.throwawayWallet.address)
					.call();
				if (
					erc20TokenBalance.toString() !=
					rootStore.currentState.throwawayWalletERC20TokenBalance
				) {
					rootStore.dispatch([
						'SET_THROWAWAY_WALLET_ERC20_TOKEN_BALANCE',
						erc20TokenBalance.toString()
					]);
				}
			} else {
				console.log('no erc20 contract selected');
			}
		} catch (e) {
			console.error(e);
		}
	}
	async liveUpdatethrowawayWalletBalance() {
		while (true) {
			this.updateThrowawayWalletBalance();
			await new Promise(r => setTimeout(r, 3000));
		}
	}

	async requiredPrompt(
		promptText: string,
		validator: (input: string) => boolean,
		defaultValue?: string
	) {
		let output: string;
		while (!output) {
			const input = prompt(promptText, defaultValue);
			output = validator(input) ? input : null;
		}
		return output;
	}

	private async checkIfERC20ContractNeedsApproval(
		contract: ERC20
	): Promise<boolean> {
		const allowanceRtn = await contract.methods
			.allowance(
				rootStore.currentState.throwawayWallet.address,
				Addresses.Sablier.select()
			)
			.call();
		const allowanceRtnBN = new BN(allowanceRtn);
		return allowanceRtnBN.lt(
			this.web3.utils.toBN(
				rootStore.currentState.throwawayWalletERC20TokenBalance
			)
		);
	}

	private async approveErc20Contract(erc20Contract: ERC20) {
		const approveTx = erc20Contract.methods.approve(
			Addresses.Sablier.select(),
			rootStore.currentState.throwawayWalletERC20TokenBalance
		);
		const gas = await approveTx.estimateGas();
		const gasPrice = await this.web3.eth.getGasPrice();
		const isApproved = await approveTx.send({
			from: rootStore.currentState.throwawayWallet.address,
			gas,
			gasPrice
		});
		return isApproved;
	}

	private async createSablierStream(
		recipientAddress: string,
		startDateTime: Date,
		endDateTime: Date,
		machineReadableTokenQuantity: string | number
	): Promise<void> {
		const state = rootStore.currentState;
		const transactionObject = await this.contracts.SablierContract.methods.createStream(
			recipientAddress,
			machineReadableTokenQuantity,
			state.erc20Token.address,
			this.dateToUnix(startDateTime),
			this.dateToUnix(endDateTime)
		);
		//  250, 000;
		const gas = await (async () => {
			try {
				const estimatedGas = await transactionObject.estimateGas();
				return estimatedGas;
			} catch (e) {
				console.log('Sablier gas estimation failed as expected.');
				const defaultGas = 300000;
				console.log('defaulting to ' + defaultGas + ' Gas');
				return defaultGas;
			}
		})();
		const gasPrice = await this.web3.eth.getGasPrice();
		const streamResult = await transactionObject.send({
			from: state.throwawayWallet.address,
			gas,
			gasPrice
		});
		localStorage.setItem('streamResult', streamResult.toString());
		alert('successfully created stream #' + streamResult.toString());
		console.log('transaction object result!', transactionObject);
	}

	dateToUnix(date: Date): number {
		return Math.ceil(date.getTime() / 1000);
	}

	/** https://docs.sablier.finance/streams#the-deposit-gotcha */
	calculateNearestValidSablierDepositAmount(
		humanReadableTokenQuantity: string,
		startDateTime: Date,
		endDateTime: Date,
		token: ERC20TokenInfo
	): string {
		const formattedTokenQuantity = this.calculateMachineReadableTokenQuantity(
			humanReadableTokenQuantity,
			token.decimals
		);
		const timeDelta = new BigNumber(this.dateToUnix(endDateTime)).minus(
			new BigNumber(this.dateToUnix(startDateTime))
		);
		const rawValidAmount = new BigNumber(formattedTokenQuantity).minus(
			new BigNumber(formattedTokenQuantity).mod(new BigNumber(timeDelta))
		);
		return rawValidAmount.toFixed(0);
	}

	async initiateStreamFromThrowawayWallet() {
		const state = rootStore.currentState;
		const erc20Contract = this.contracts.ERC20TokenContract;
		const recipientAddress = await this.requiredPrompt(
			'Recipient Address',
			recipientAttempt => state.web3.utils.isAddress(recipientAttempt),
			'0xf63347B9D09f8c1c34Dc70757295E7e2A060A7fA'
		);
		const doesNeedApproval = await this.checkIfERC20ContractNeedsApproval(
			erc20Contract
		);
		console.log('checked for approval', doesNeedApproval);
		if (doesNeedApproval) {
			const approved = await this.approveErc20Contract(erc20Contract);
			console.log('approved:', approved);
		}
		console.log('approved');
		const startDateTimeStr = await this.requiredPrompt(
			'Date to start sending inheritance MM/DD/YYYY',
			s => new Date(s).getTime() > new Date().getTime(),
			new Date(Date.now() + 5 * 60 * 1000).toISOString()
		);
		const endDateTimeStr = await this.requiredPrompt(
			'Date to stop sending inheritance MM/DD/YYYY',
			s => new Date(s).getTime() > new Date(startDateTimeStr).getTime(),
			new Date(Date.now() + 30 * 60 * 1000).toISOString()
		);
		const startDateTime = new Date(startDateTimeStr);
		const endDateTime = new Date(endDateTimeStr);
		const depositAmount = this.calculateNearestValidSablierDepositAmount(
			state.sablierHumanReadableTokenDepositQuantity,
			startDateTime,
			endDateTime,
			rootStore.currentState.erc20Token
		);
		await this.createSablierStream(
			recipientAddress,
			startDateTime,
			endDateTime,
			depositAmount
		);
		console.log('created stream');
	}

	async loadMetamaskClient() {
		const ethereum = (window as any).ethereum;
		// Avoid `MaxListenersExceededWarning` Warning from Metamask
		if (!ethereum) return null;

		const addresses = await ethereum.enable();
		ethereum.setMaxListeners(1000);
		const instance = this;
		return {
			/** Returns Transaction Hash */
			sendTransaction(ethereumRpcParam: {
				// customizable by user during MetaMask confirmation.
				gasPrice?: string;
				// customizable by user during MetaMask confirmation.
				gas?: string;
				// To address hexidecimal
				to: string;
				// Ether value as hexidecimal (for sending funds from metamask)
				value?: string;
				// Smart Contract interaction data as hexidecimal (https://ethereum.stackexchange.com/a/66368)
				data?: string;
			}): Promise<string> /** Transaction hash */ {
				return new Promise((resolve, reject) =>
					ethereum.sendAsync(
						{
							method: 'eth_sendTransaction',
							params: [
								{
									...ethereumRpcParam,
									from: ethereum.selectedAddress // must match user's active address.
								}
							],
							from: ethereum.selectedAddress
						},
						(err, res) => {
							err ? reject(err) : resolve(res);
						}
					)
				);
			}
		};
	}

	async loadWeb3(): Promise<Web3> {
		return new Promise(r => {
			window.addEventListener('load', async () => {
				const { web3 }: { web3: Web3 } = window as any;
				const addresses = await (window as any).ethereum.enable();
				(window as any).ethereum.setMaxListeners(1000);
				const instance = new Web3(
					(window as any).ethereum || web3.currentProvider
				);
				r(instance);
			});
		});
	}
}
