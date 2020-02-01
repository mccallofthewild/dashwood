import Web3 from 'web3';
import { Store } from './framework/Store';
import { Sablier } from '../contracts/types/Sablier';
import { ERC20 } from '../contracts/types/ERC20';
import { Account } from 'web3-core/types';
import { AppService } from './services/AppService';
import { ERC20TokenInfo, Erc20Data } from './utils/Erc20Data';

export type TransferStage =
	| 'HOME_STAGE'
	| 'TOKEN_SELECT_STAGE'
	| 'DEPOSIT_STAGE'
	| 'PROCESSING_SABLIER_STAGE'
	| 'SABLIER_SUCCESS_STAGE'
	| 'FINAL_STAGE';
export type Action =
	| ['SET_WEB3', Web3]
	| ['SET_SABLIER_CONTRACT', Sablier]
	| ['SET_ERC20_CONTRACT', ERC20]
	| ['SET_THROWAWAY_WALLET', Account]
	| ['SET_THROWAWAY_WALLET_ETHER_BALANCE', string]
	| ['SET_THROWAWAY_WALLET_ERC20_TOKEN_BALANCE', string]
	| ['SET_TRANSFER_STAGE', TransferStage]
	| ['SET_ERC20_TOKEN', ERC20TokenInfo]
	| ['MERGE_PERSISTED_STATE', { [key: string]: State[keyof State] }]
	| ['SET_SABLIER_START_DATE', string]
	| ['SET_SABLIER_END_DATE', string]
	| ['SET_SABLIER_TOKEN_DEPOSIT_QUANTITY', string]
	| ['SET_SABLIER_RECEIVING_ADDRESS', string];

export interface State {
	web3?: Web3;
	contracts: {
		sablier?: Sablier;
		erc20?: ERC20;
	};
	throwawayWalletWeiBalance?: string;
	throwawayWallet?: Account;
	transferStage: TransferStage;
	erc20Token?: ERC20TokenInfo;
	throwawayWalletERC20TokenBalance?: string;
	sablierStartDate?: string;
	sablierEndDate?: string;
	sablierHumanReadableTokenDepositQuantity?: string;
	sablierReceivingAddress?: string;

	erc20TokensList: typeof Erc20Data.tokens;
}
function persist() {
	const persistKey = 'store__persist';
	const persisted = localStorage.getItem(persistKey);
	if (persisted) {
		try {
			rootStore.dispatch(['MERGE_PERSISTED_STATE', JSON.parse(persisted)]);
		} catch (e) {}
	}
	rootStore.addListener(
		({
			erc20Token,
			sablierEndDate,
			sablierStartDate,
			sablierReceivingAddress,
			sablierHumanReadableTokenDepositQuantity,
			transferStage
		}) => {
			const persistState = {
				erc20Token,
				sablierEndDate,
				sablierStartDate,
				sablierReceivingAddress,
				sablierHumanReadableTokenDepositQuantity,
				transferStage
			};
			localStorage.setItem(persistKey, JSON.stringify(persistState));
		}
	);
}
setTimeout(persist, 0.001);
export const rootStore = new Store<Action, State>(
	(
		state: State = {
			web3: null,
			contracts: {},
			transferStage: 'HOME_STAGE',
			sablierStartDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
			sablierEndDate: new Date(Date.now() + 60 * 60 * 1000 * 24).toISOString(),
			erc20TokensList: Erc20Data.tokens
		} as const,
		action: Action = [null, null]
	) => {
		switch (action[0]) {
			case 'MERGE_PERSISTED_STATE': {
				return {
					...state,
					...action[1]
				};
			}
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
					throwawayWalletWeiBalance: action[1]
				};
			}
			case 'SET_THROWAWAY_WALLET_ERC20_TOKEN_BALANCE': {
				return {
					...state,
					throwawayWalletERC20TokenBalance: action[1]
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
			case 'SET_SABLIER_START_DATE': {
				return {
					...state,
					sablierStartDate: action[1]
				};
			}
			case 'SET_SABLIER_END_DATE': {
				return {
					...state,
					sablierEndDate: action[1]
				};
			}
			case 'SET_SABLIER_TOKEN_DEPOSIT_QUANTITY': {
				return {
					...state,
					sablierHumanReadableTokenDepositQuantity: action[1]
				};
			}
			case 'SET_SABLIER_RECEIVING_ADDRESS': {
				return {
					...state,
					sablierReceivingAddress: action[1]
				};
			}
		}
		return state;
	}
);
