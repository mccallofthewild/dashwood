// KOVAN TESTNET
const isDev = process.env.NODE_ENV == 'development';

const ERC20 = {
	MAINNET: '0x6b175474e89094c44da98b954eedeac495271d0f',
	TESTNET: '0x722dd3F80BAC40c951b51BdD28Dd19d435762180',
	select() {
		return isDev ? ERC20.TESTNET : ERC20.MAINNET;
	}
};

const Sablier = {
	MAINNET: '0xA4fc358455Febe425536fd1878bE67FfDBDEC59a',
	TESTNET: '0xc04Ad234E01327b24a831e3718DBFcbE245904CC',
	select() {
		return isDev ? Sablier.TESTNET : Sablier.MAINNET;
	}
};

export const Addresses = {
	ERC20,
	Sablier
};
