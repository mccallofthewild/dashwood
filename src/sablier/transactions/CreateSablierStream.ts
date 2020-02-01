import {
	TransactionWrapper,
	TransactionGasPriceArg
} from './TransactionWrapper';
import BN from 'bn.js';
import { Sablier } from '../../../contracts/types/Sablier';

/**
 * Checks how much of the ERC20 Token we've allowed Sablier to use
 * Example Stream: https://kovan.etherscan.io/tx/0x611dca5de2469be737423e84250b14ab47865269761690ce7a473e490dd17306#eventlog
 *
 */
export class CreateSablierStream extends TransactionWrapper<
	Sablier,
	BN,
	{
		startDateTimeUnix: number;
		endDateTimeUnix: number;
		recipientAddress: string;
		tokenQuantity: string | number;
		tokenContractAddress: string;
		fromAddress: string;
	}
> {
	createTx() {
		const contract = this.Contract.clone();
		contract.options.from = this.txOptions.fromAddress;
		const {
			recipientAddress,
			tokenQuantity,
			tokenContractAddress,
			startDateTimeUnix,
			endDateTimeUnix
		} = this.txOptions;
		const transactionObject = contract.methods.createStream(
			recipientAddress,
			tokenQuantity,
			tokenContractAddress,
			startDateTimeUnix,
			endDateTimeUnix
		);
		return transactionObject;
	}
	async estimateTxCosts({ gasPrice }: TransactionGasPriceArg) {
		const transactionObject = this.createTx();
		//  250, 000;
		const gas = await (async () => {
			try {
				console.warn('👇👇👇 Expect error for Sablier#estimateGas');
				const estimatedGas = await transactionObject.estimateGas();
				return estimatedGas;
			} catch (e) {
				console.warn(`👆👆👆 Sablier#estimateGas failed as expected.`);
				const defaultGas = 300000;
				console.warn(
					'Defaulting to ' + defaultGas + ' Gas for Sablier transaction.'
				);
				return defaultGas;
			}
		})();
		return {
			gas: new BN(gas),
			gasPrice: new BN(gasPrice),
			fee: new BN(new BN(gas).mul(new BN(gasPrice)))
		};
	}
	async invokeTx(prices) {
		console.log(/** */ `Shouldn't need nonce`);
		// const nonce = await this.getNonceByAddress(this.txOptions.fromAddress);
		const streamResult = await this.createTx().send({
			from: this.txOptions.fromAddress,
			// nonce,
			...prices
		});
		return streamResult;
	}
}
