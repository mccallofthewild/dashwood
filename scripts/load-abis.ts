import { Addresses } from '../contracts/addresses';
import { fetch } from 'cross-fetch';
import fs from 'fs';
import path from 'path';

const loadABIFromAddress = async address => {
	const res = await fetch(
		`https://api.etherscan.io/api?module=contract&action=getabi&address=${address}`
	);
	const json = await res.json();
	const stringifiedABI = json.result;
	try {
		if (typeof JSON.parse(stringifiedABI) == 'object') return stringifiedABI;
	} catch (e) {}
	return false;
};

const CONTRACT_ABI_PATH = path.join(__dirname, '../contracts/abis');
// ;
(async () => {
	fs.rmdirSync(CONTRACT_ABI_PATH, {
		recursive: true
	});
	fs.mkdirSync(CONTRACT_ABI_PATH);
	for (let contractName in Addresses) {
		const main = await loadABIFromAddress(Addresses[contractName].MAINNET);

		if (!!main)
			fs.writeFileSync(CONTRACT_ABI_PATH + '/' + contractName + '.json', main);
	}
})();
