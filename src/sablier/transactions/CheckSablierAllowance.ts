import { Addresses } from '../../../contracts/addresses';
import { ERC20 } from '../../../contracts/types/ERC20';
import {
	TransactionWrapper,
	TransactionGasPriceArg
} from './TransactionWrapper';
import BN from 'bn.js';

/** Checks how much of the ERC20 Token we've allowed Sablier to use */
export class CheckSablierAllowance extends TransactionWrapper<
	ERC20,
	BN,
	{ walletAddress: string }
> {
	createTx() {
		return this.Contract.methods.allowance(
			this.txOptions.walletAddress,
			Addresses.Sablier.select()
		);
	}
	async estimateTxCosts({ gasPrice }: TransactionGasPriceArg) {
		// .call query transactions have no cost
		return {
			gas: new BN(0),
			gasPrice: new BN(0),
			fee: new BN(0)
		};
	}
	async invokeTx() {
		const allowanceRtn = await this.createTx().call();
		const allowanceRtnBN = new BN(allowanceRtn);
		return allowanceRtnBN;
	}
}
