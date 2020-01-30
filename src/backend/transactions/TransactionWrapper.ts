import Web3 from 'web3';
import BN from 'bn.js';
import { TransactionObject } from '../../../contracts/types/types';

export abstract class TransactionWrapper<
	ContractT,
	TxObjectT,
	TxOptionsT = {}
> {
	constructor(
		public web3: Web3,
		public Contract: ContractT,
		public txOptions: TxOptionsT
	) {}
	toBN(num: string | number | BN) {
		return new BN(num);
	}
	abstract async estimateTxCosts(): Promise<{
		gas: BN;
		gasPrice: BN;
		fee: BN;
	}>;
	abstract createTx(): TransactionObject<TxObjectT>;
	abstract async invokeTx(prices: {
		gas: string | number;
		gasPrice: string | number;
	}): Promise<TxObjectT>;
}
