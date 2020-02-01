import Web3 from 'web3';
import BN from 'bn.js';
import { TransactionObject } from '../../../contracts/types/types';

export type TransactionPrices = {
	gas: string | number;
	gasPrice: string | number;
};
export type TransactionGasPriceArg = {
	gasPrice: BN;
};
export abstract class TransactionWrapper<
	ContractT,
	TxObjectT,
	TxOptionsT = {}
> {
	private readonly createdTx: TransactionObject<TxObjectT>;
	constructor(
		public web3: Web3,
		public Contract: ContractT,
		public txOptions: TxOptionsT
	) {
		this.createdTx = this.createTx();
		this.createTx = () => this.createdTx;
	}

	private static nonceByAddress = new Map<string, number>();
	protected async getNonceByAddress(address: string): Promise<number> {
		const nonce = await this.web3.eth.getTransactionCount(address);
		const nextNonce = nonce + 1;
		TransactionWrapper.nonceByAddress.set(address, nextNonce);
		return nextNonce;
	}
	toBN(num: string | number | BN) {
		return new BN(num);
	}
	abstract async estimateTxCosts({
		gasPrice: BN
	}): Promise<{
		gas: BN;
		gasPrice: BN;
		fee: BN;
	}>;
	abstract createTx(): TransactionObject<TxObjectT>;
	abstract async invokeTx(prices: TransactionPrices): Promise<TxObjectT>;
}
