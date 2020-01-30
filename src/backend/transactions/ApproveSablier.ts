import { Addresses } from '../../../contracts/addresses';
import { ERC20 } from '../../../contracts/types/ERC20';
import { TransactionWrapper } from './TransactionWrapper';

export class ApproveSablier extends TransactionWrapper<
	ERC20,
	boolean,
	{
		amountOfTokenToApprove: string | number;
		fromAddress: string;
	}
> {
	createTx() {
		const approveTx = this.Contract.methods.approve(
			Addresses.Sablier.select(),
			this.txOptions.amountOfTokenToApprove
		);
		return approveTx;
	}
	async estimateTxCosts() {
		const gasInt = await this.createTx().estimateGas();
		const gasPriceInt = await this.web3.eth.getGasPrice();
		const gas = this.toBN(gasInt);
		const gasPrice = this.toBN(gasPriceInt);
		const fee = gas.mul(gasPrice);
		return {
			gas,
			gasPrice,
			fee
		};
	}

	async invokeTx(prices) {
		const isApproved = await this.createTx().send({
			from: this.txOptions.fromAddress,
			...prices
		});
		return isApproved;
	}
}
