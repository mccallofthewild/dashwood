import './polyfills';
import { State, Action, rootStore } from './rootStore';
import { AppService } from './services/AppService';
import './app.scss';
import { Erc20Data } from './utils/Erc20Data';
import * as QRCode from 'qrcode';
import { FlipAnimation } from './utils/FLIPAnimation';

const LOGO_IMAGE = require('./assets/logo.png').default;

const service = new AppService();

service.init().then(() => {
	service.generateThrowawayWallet();
});

const $ = (...args: [TemplateStringsArray, ...any[]]) => {
	return document.querySelector(String.raw(...args));
};

const els = {
	// ROOT (APP LEVEL)
	rootLogoContainer: $`[role='root--logo-container']`,
	rootLogo: $`[role=root--logo]`,
	// HOME
	homeStep: $`[role='steps--home']`,
	homeContinue: $`[role='home--continue']`,
	homeLogo: $`[role='home--logo']`,
	// SELECT TOKEN
	selectTokenStep: $`[role=steps--select-token]`,
	selectTokenSelect: $`[role="select-token--select"]`,
	selectTokenForm: $`[role="select-token--form"]`,
	// DEPOSIT FUNDS
	depositFundsStep: $`[role="steps--deposit-funds"]`,
	depositFundsAddress: $`[role="deposit-funds--address"]`,
	depositFundsQrCode: $`[role="deposit-funds--qrcode"]`
} as const;

// TRANSFER STAGE DOM REACTIONS
rootStore.addListener(async (state, action) => {
	switch (action[0]) {
		case 'SET_TRANSFER_STAGE': {
			let activeStageEl = els.homeStep;
			switch (action[1]) {
				case 'HOME_STAGE': {
					activeStageEl = els.homeStep;
					break;
				}
				case 'TOKEN_SELECT_STAGE': {
					await FlipAnimation.fade(`[role="steps--home"] > *:not([animated])`);
					await FlipAnimation.transition(
						els.homeLogo as HTMLElement,
						els.rootLogo as HTMLElement
					);
					activeStageEl = els.selectTokenStep;
					break;
				}
				case 'DEPOSIT_STAGE': {
					activeStageEl = els.depositFundsStep;
					break;
				}
			}
			[els.homeStep, els.depositFundsStep, els.selectTokenStep].forEach(el =>
				el.removeAttribute('active')
			);
			activeStageEl.setAttribute('active', 'active');
		}
	}
});

// HOME

els.homeContinue.addEventListener('click', () =>
	rootStore.dispatch(['SET_TRANSFER_STAGE', 'TOKEN_SELECT_STAGE'])
);

// SELECTING TOKEN

els.selectTokenSelect.addEventListener('change', () => {
	console.log(((els.selectTokenSelect as unknown) as any).value);
});

els.selectTokenForm.addEventListener(
	'submit',
	() => rootStore.dispatch(['SET_TRANSFER_STAGE', 'DEPOSIT_STAGE']),
	{
		once: true
	}
);

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

// Initializing DOM

async function initalize() {
	Erc20Data.tokens.forEach(token => {
		const option = document.createElement('option');
		option.setAttribute('value', token.name);
		option.innerHTML = token.name;
		els.selectTokenSelect.appendChild(option);
	});
	document.querySelectorAll('form').forEach(f =>
		f.addEventListener('submit', e => {
			e.preventDefault();
			console.log(f);
			console.log('prevented default');
		})
	);
	await fetch(LOGO_IMAGE);
	await Promise.all(
		[els.homeLogo, els.rootLogo].map(el => {
			return new Promise(r => {
				el.addEventListener('load', r);
				el.setAttribute('src', LOGO_IMAGE);
			});
		})
	);
}
initalize();
