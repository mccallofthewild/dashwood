import './polyfills';
import { State, Action, rootStore } from './rootStore';
import { AppService } from './services/AppService';
import './app.scss';
import { Erc20Data } from './utils/Erc20Data';
import * as QRCode from 'qrcode';

const LOGO_IMAGE = require('./assets/logo.png').default;

const service = new AppService();

service.init().then(() => {
	service.generateThrowawayWallet();
});

const $ = (...args: [TemplateStringsArray, ...any[]]) => {
	return document.querySelector(String.raw(...args));
};

const els = {
	logo: $`[role=logo]`,
	homeStep: $`[role='steps--home']`,
	homeContinue: $`[role='home--continue']`,
	selectTokenStep: $`[role=steps--select-token]`,
	selectTokenSelect: $`[role="select-token--select"]`,
	selectTokenForm: $`[role="select-token--form"]`,
	depositFundsStep: $`[role="steps--deposit-funds"]`,
	depositFundsAddress: $`[role="deposit-funds--address"]`,
	depositFundsQrCode: $`[role="deposit-funds--qrcode"]`
} as const;

Erc20Data.tokens.forEach(token => {
	const option = document.createElement('option');
	option.setAttribute('value', token.name);
	option.innerHTML = token.name;
	els.selectTokenSelect.appendChild(option);
});

rootStore.addListener((state, action) => {
	switch (action[0]) {
		case 'SET_THROWAWAY_WALLET_BALANCE': {
		}
	}
});

// HOME
els.logo.setAttribute('src', LOGO_IMAGE);

els.homeContinue.addEventListener('click', () => {
	els.homeStep.removeAttribute('active');
	els.selectTokenStep.setAttribute('active', 'active');
});

// SELECTING TOKEN
els.selectTokenSelect.addEventListener('change', () => {
	console.log(((els.selectTokenSelect as unknown) as any).value);
});

els.selectTokenForm.addEventListener('submit', () => {
	els.selectTokenStep.removeAttribute('active');
	alert(
		`This Dapp is under active development. Please do not send any cryptocurrency or tokens to the addresses provided at this time.`
	);
	els.depositFundsStep.setAttribute('active', 'active');
});

// DEPOSITING FUNDS

rootStore.addListener(async (state, action) => {
	switch (action[0]) {
		case 'SET_THROWAWAY_WALLET': {
			if (!state.throwawayWallet) break;
			const etherURI = /**/ `ethereum:${state.throwawayWallet.address}`;
			els.depositFundsAddress.innerHTML = state.throwawayWallet.address;
			els.depositFundsAddress.setAttribute('href', etherURI);
			els.depositFundsQrCode.setAttribute(
				'src',
				await QRCode.toDataURL(etherURI, {
					scale: 10
				})
			);
			return;
		}
		case 'SET_THROWAWAY_WALLET_BALANCE': {
			if (+action[1]) {
				els.depositFundsStep.removeAttribute('active');
				console.log('need to get erc20 token balance too');
				console.log('need next step');
			}
		}
	}
});

document.querySelectorAll('form').forEach(f =>
	f.addEventListener('submit', e => {
		e.preventDefault();
		console.log(f);
		console.log('prevented default');
	})
);
