import { Addresses } from '../../../contracts/addresses';
import { ERC20 } from '../../../contracts/types/ERC20';
import {
	TransactionWrapper,
	TransactionPrices,
	TransactionGasPriceArg
} from './TransactionWrapper';

export class ApproveSablier extends TransactionWrapper<
	ERC20,
	boolean,
	{
		amountOfTokenToApprove: string | number;
		fromAddress: string;
	}
> {
	createTx() {
		const contract = this.Contract.clone();
		contract.options.from = this.txOptions.fromAddress;
		const approveTx = contract.methods.approve(
			Addresses.Sablier.select(),
			this.txOptions.amountOfTokenToApprove
		);
		return approveTx;
	}
	async estimateTxCosts({ gasPrice }: TransactionGasPriceArg) {
		const gasInt = await this.createTx().estimateGas();
		const gas = this.toBN(gasInt);
		const fee = gas.mul(gasPrice);
		return {
			gas,
			gasPrice,
			fee
		};
	}

	async invokeTx(prices: TransactionPrices) {
		const nonce = await this.getNonceByAddress(this.txOptions.fromAddress);
		const isApproved = await this.createTx().send({
			from: this.txOptions.fromAddress,
			nonce,
			...prices
		});
		return isApproved;
	}
}
