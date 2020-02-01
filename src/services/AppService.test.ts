import '../polyfills.js';
import { AppService } from './AppService';
import { ERC20TokenInfo } from '../utils/Erc20Data';
describe('AppService', () => {
	const service = new AppService();
	const token: ERC20TokenInfo = {
		name: 'McCallCoin',
		erc20: true,
		decimals: 18,
		logo: '',
		symbol: 'MCC'
	};
	test('#calculateNearestValidSablierDepositAmount', () => {
		const startDateTime = new Date(0);
		const endDateTime = new Date(1);
		const humanReadableTokenQuantity = '111';

		const nearest = service.calculateNearestValidSablierDepositAmount(
			humanReadableTokenQuantity,
			startDateTime,
			endDateTime,
			token
		);
		expect(nearest).toBe(humanReadableTokenQuantity + ''.padEnd(18, '0'));
	});
	test('#calculateNearestValidSablierDepositAmount', () => {
		const startDateTime = new Date(0);
		const endDateTime = new Date(2592000 * 1000);
		const humanReadableTokenQuantity = '3000';
		const nearest = service.calculateNearestValidSablierDepositAmount(
			humanReadableTokenQuantity,
			startDateTime,
			endDateTime,
			token
		);
		expect(nearest).toBe('2999999999999998944000');
	});
	test('#calculateNearestValidSablierDepositAmount', () => {
		const startDateTime = new Date(1587858480 * 1000);
		const endDateTime = new Date(1587944880 * 1000);
		const humanReadableTokenQuantity = '10';
		const nearest = service.calculateNearestValidSablierDepositAmount(
			humanReadableTokenQuantity,
			startDateTime,
			endDateTime,
			token
		);
		expect(nearest).toBe('9999999999999936000');
	});
	test('#calculateHumanReadableTokenQuantity', () => {
		const decimals = 18;
		const answer = '3000';
		const result = service.calculateHumanReadableTokenQuantity(
			answer + ''.padStart(18, '0'),
			decimals
		);
		expect(result).toBe(answer);
	});
	test('#calculateHumanReadableTokenQuantity', () => {
		const decimals = 18;
		const input = '3000';
		const result = service.calculateMachineReadableTokenQuantity(
			input,
			decimals
		);
		expect(result).toBe(input + ''.padStart(18, '0'));
	});
});
