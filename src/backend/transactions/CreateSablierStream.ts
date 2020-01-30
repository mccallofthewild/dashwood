import { TransactionWrapper } from './TransactionWrapper';
import BN from 'bn.js';
import { Sablier } from '../../../contracts/types/Sablier';

/** Checks how much of the ERC20 Token we've allowed Sablier to use */
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
		const {
			recipientAddress,
			tokenQuantity,
			tokenContractAddress,
			startDateTimeUnix,
			endDateTimeUnix
		} = this.txOptions;
		const transactionObject = this.Contract.methods.createStream(
			recipientAddress,
			tokenQuantity,
			tokenContractAddress,
			startDateTimeUnix,
			endDateTimeUnix
		);
		return transactionObject;
	}
	async estimateTxCosts() {
		const transactionObject = this.createTx();
		//  250, 000;
		const gas = await (async () => {
			try {
				console.warn('Expect error for Sablier#estimateGas');
				const estimatedGas = await transactionObject.estimateGas();
				return estimatedGas;
			} catch (e) {
				console.warn('Sablier gas estimation failed as expected.');
				const defaultGas = 300000;
				console.warn('defaulting to ' + defaultGas + ' Gas');
				return defaultGas;
			}
		})();
		const gasPrice = await this.web3.eth.getGasPrice();
		return {
			gas: new BN(gas),
			gasPrice: new BN(gasPrice),
			fee: new BN(new BN(gas).mul(new BN(gasPrice)))
		};
	}
	async invokeTx(prices) {
		const streamResult = await this.createTx().send({
			from: this.txOptions.fromAddress,
			...prices
		});
		return streamResult;
	}
}
