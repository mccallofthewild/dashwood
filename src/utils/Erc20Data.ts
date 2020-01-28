import _Erc20TokensMap from 'eth-contract-metadata';

export interface ERC20TokenInfo {
	name: string;
	logo: string;
	erc20: true;
	symbol: string;
	decimals: number;
	address?: string;
}
const Erc20TokensMap: {
	[key: string]: ERC20TokenInfo;
} = _Erc20TokensMap;

// @ts-ignore
const context = require.context('eth-contract-metadata/images', false);
const tokenImages = Object.fromEntries(
	context
		.keys()
		.map(filename => [filename.replace('./', ''), context(filename).default])
);

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
	static get tokens(): ERC20TokenInfo[] {
		return process.env.NODE_ENV == 'development'
			? [
					{
						name: 'XEENUS',
						address: '0x022E292b44B5a146F2e8ee36Ff44D3dd863C915c',
						erc20: true,
						symbol: 'XEENUS',
						decimals: 18,
						logo: Erc20Tokens[0].logo
					}
			  ]
			: Erc20Tokens;
	}
}
