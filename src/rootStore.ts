import Web3 from 'web3';
import { Store } from './framework/Store';
import { Sablier } from '../contracts/types/Sablier';
import { ERC20 } from '../contracts/types/ERC20';
import { Account } from 'web3-core/types';
import { AppService } from './services/AppService';
import { ERC20TokenInfo } from './utils/Erc20Data';

type TransferStage =
	| 'HOME_STAGE'
	| 'TOKEN_SELECT_STAGE'
	| 'DEPOSIT_STAGE'
	| 'FINAL_STAGE';
export type Action =
	| ['SET_WEB3', Web3]
	| ['SET_SABLIER_CONTRACT', Sablier]
	| ['SET_ERC20_CONTRACT', ERC20]
	| ['SET_THROWAWAY_WALLET', Account]
	| ['SET_THROWAWAY_WALLET_ETHER_BALANCE', string]
	| ['SET_TRANSFER_STAGE', TransferStage]
	| ['SET_ERC20_TOKEN', ERC20TokenInfo];

export interface State {
	web3?: Web3;
	contracts: {
		sablier?: Sablier;
		erc20?: ERC20;
	};
	throwawayWalletEtherBalance?: string;
	throwawayWallet?: Account;
	transferStage: TransferStage;
	erc20Token?: ERC20TokenInfo;
}

export const rootStore = new Store<Action, State>(
	(
		state: State = {
			web3: null,
			contracts: {},
			transferStage: 'HOME_STAGE'
		} as const,
		action: Action = [null, null]
	) => {
		switch (action[0]) {
			case 'SET_WEB3': {
				return {
					...state,
					web3: action[1]
				};
			}
			case 'SET_SABLIER_CONTRACT': {
				return {
					...state,
					contracts: {
						sablier: action[1]
					}
				};
			}
			case 'SET_ERC20_CONTRACT': {
				return {
					...state,
					contracts: {
						erc20: action[1]
					}
				};
			}
			case 'SET_THROWAWAY_WALLET': {
				return {
					...state,
					throwawayWallet: action[1]
				};
			}
			case 'SET_THROWAWAY_WALLET_ETHER_BALANCE': {
				return {
					...state,
					throwawayWalletEtherBalance: action[1]
				};
			}
			case 'SET_TRANSFER_STAGE': {
				return {
					...state,
					transferStage: action[1]
				};
			}
			case 'SET_ERC20_TOKEN': {
				return {
					...state,
					erc20Token: action[1]
				};
			}
		}
		return state;
	}
);
