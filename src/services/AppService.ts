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

// console.log(context);
export class AppService {
	async init() {
		MouseEntropy.start();
		const web3 = await this.loadWeb3();
		rootStore.dispatch(['SET_WEB3', web3]);
		this.liveUpdatethrowawayWalletEtherBalance();
	}

	generateThrowawayWallet() {
		const web3 = rootStore.currentState.web3;
		const throwawayWallet = rootStore.currentState.web3.eth.accounts.create(
			web3.utils.randomHex(32) + MouseEntropy.entropy
		);
		rootStore.dispatch(['SET_THROWAWAY_WALLET', throwawayWallet]);
		const sablierContract: Sablier = new web3.eth.Contract(
			(SABLIER_ABI as unknown) as AbiItem,
			Addresses.Sablier.MAINNET,
			{
				from: rootStore.currentState.throwawayWallet.address
			}
		);
		rootStore.dispatch(['SET_SABLIER_CONTRACT', sablierContract]);
		const erc20Contract: ERC20 = new web3.eth.Contract(
			(ERC20_ABI as unknown) as AbiItem,
			Addresses.ERC20.MAINNET,
			{
				from: rootStore.currentState.throwawayWallet.address
			}
		);
		rootStore.dispatch(['SET_ERC20_CONTRACT', erc20Contract]);
	}

	async liveUpdatethrowawayWalletEtherBalance() {
		try {
			if (rootStore.currentState.throwawayWallet) {
				const balance = await rootStore.currentState.web3.eth.getBalance(
					rootStore.currentState.throwawayWallet.address
				);
				rootStore.dispatch(['SET_THROWAWAY_WALLET_ETHER_BALANCE', balance]);
			}
		} catch (e) {
			console.error(e);
		}
		setTimeout(() => {
			this.liveUpdatethrowawayWalletEtherBalance();
		}, 5000);
	}

	async loadWeb3(): Promise<Web3> {
		return new Promise(r => {
			window.addEventListener('load', () => {
				const { web3 }: { web3: Web3 } = window as any;
				const instance = new Web3(web3.currentProvider);
				r(instance);
			});
		});
	}
}
