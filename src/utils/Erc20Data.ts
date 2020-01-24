import _Erc20TokensMap from 'eth-contract-metadata';
const Erc20TokensMap: {
	[key: string]: {
		name: string;
		logo: string;
		erc20: true;
		symbol: string;
		decimals: number;
	};
} = _Erc20TokensMap;

// @ts-ignore
const context = require.context('eth-contract-metadata/images', false);
const tokenImages = Object.fromEntries(
	context
		.keys()
		.map(filename => [filename.replace('./', ''), context(filename).default])
);
console.log(tokenImages);

const Erc20Tokens = Object.entries(Erc20TokensMap)
	.map(([address, data]) => ({
		...data,
		logo: tokenImages[data.logo],
		address
	}))
	.filter(data => data.erc20)
	.sort((tokenA, tokenB) => {
		const a = tokenA.name;
		const b = tokenB.name;
		if (a < b) return -1;
		if (a > b) return 1;
		if (a == b) return 0;
	});
export class Erc20Data {
	static get tokens() {
		return Erc20Tokens;
	}
}
