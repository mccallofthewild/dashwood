import './polyfills';
import { State, Action, rootStore } from './rootStore';
import { AppService } from './services/AppService';
import './app.scss';
import { Erc20Data } from './utils/Erc20Data';
import * as QRCode from 'qrcode';
import { Transitions } from './utils/Transitions';
const TREE_IMAGE = require('./assets/tree-plain.svg').default;

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
	selectTokenContinue: $`[role="select-token--continue" ]`,
	// DEPOSIT FUNDS
	depositFundsStep: $`[role="steps--deposit-funds"]`,
	depositFundsAddress: $`[role="deposit-funds--address"]`,
	depositFundsQrCode: $`[role="deposit-funds--qrcode"]`,
	depositFundsContinue: $`[role="deposit-funds--continue"]`,
	depositFundsTokenName: $`[role="deposit-funds--token-name"]`
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
					Transitions.FLIP(
						els.homeLogo as HTMLElement,
						els.rootLogo as HTMLElement
					);
					Transitions.FLIP(
						els.homeContinue as HTMLElement,
						els.selectTokenContinue as HTMLElement
					);
					activeStageEl = els.selectTokenStep;
					break;
				}
				case 'DEPOSIT_STAGE': {
					await Transitions.anime({
						targets: els.selectTokenContinue,
						color: ['rgba(255,255,255,1)', 'rgba(255,255,255,0)'],
						duration: 100
					}).finished;
					Transitions.FLIP(
						els.selectTokenContinue as HTMLElement,
						els.depositFundsQrCode as HTMLElement
					);
					activeStageEl = els.depositFundsStep;
					break;
				}
				case 'FINAL_STAGE': {
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

els.homeContinue.addEventListener(
	'click',
	() => rootStore.dispatch(['SET_TRANSFER_STAGE', 'TOKEN_SELECT_STAGE']),
	{ once: true }
);

// SELECTING TOKEN

els.selectTokenSelect.addEventListener('change', () => {
	const tokenName = ((els.selectTokenSelect as unknown) as any).value;
	const selectedToken = Erc20Data.tokens.find(t => t.name == tokenName);
	rootStore.dispatch(['SET_ERC20_TOKEN', selectedToken]);
});

els.selectTokenForm.addEventListener(
	'submit',
	() => rootStore.dispatch(['SET_TRANSFER_STAGE', 'DEPOSIT_STAGE']),
	{
		once: true
	}
);

// DEPOSITING FUNDS

els.depositFundsContinue.addEventListener(
	'click',
	() => {
		rootStore.dispatch(['SET_TRANSFER_STAGE', 'FINAL_STAGE']);
	},
	{
		once: true
	}
);

rootStore.addListener(async (state, action) => {
	switch (action[0]) {
		case 'SET_ERC20_TOKEN': {
			els.depositFundsTokenName.innerHTML = action[1].name;
			break;
		}
		case 'SET_THROWAWAY_WALLET': {
			if (!state.throwawayWallet) break;
			const etherURI = /**/ `ethereum:${state.throwawayWallet.address}`;
			els.depositFundsAddress.innerHTML = state.throwawayWallet.address;
			els.depositFundsAddress.setAttribute('href', etherURI);
			els.depositFundsQrCode.setAttribute(
				'src',
				await QRCode.toDataURL(etherURI, {
					scale: 10,
					margin: 2,
					color: {
						light: '#ffffff21', // Transparent background
						dark: '#FAFAFA'
					}
				})
			);
			return;
		}
		case 'SET_THROWAWAY_WALLET_ETHER_BALANCE': {
			if (+action[1]) {
				els.depositFundsStep.removeAttribute('active');
				console.log('need to get erc20 token balance too');
				console.log('need next step');
			}
			break;
		}
	}
});

// Initializing DOM

async function initalize() {
	els.rootLogo.addEventListener(
		'click',
		() => {
			document.write('');
			window.location.reload();
			// rootStore.dispatch(['SET_TRANSFER_STAGE', 'HOME_STAGE']);
		},
		{
			once: true
		}
	);
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

if (!window.customElements.get('animated-tree-vector'))
	window.customElements.define(
		'animated-tree-vector',
		class extends HTMLElement {
			constructor() {
				super();
				const shadow = this.attachShadow({ mode: 'closed' });
				shadow.innerHTML += `
					<style>
						svg, html {
							height: inherit;
							width: inherit;
						}
					</style>
				`;
				fetch(TREE_IMAGE)
					.then(res => res.text())
					.then(async vectorImage => {
						shadow.innerHTML += vectorImage;
						const anime = Transitions.anime;
						const mainTrunkPaths = shadow.querySelectorAll(
							'svg path.main-trunk-path'
						);
						mainTrunkPaths.forEach((el: HTMLElement) => {
							el.style.strokeDasharray = '10000';
							el.style.strokeDashoffset = '10000';
						});
						const leafPaths = shadow.querySelectorAll(
							'svg g.leaf-path-group path'
						);
						leafPaths.forEach((el: HTMLElement) => {
							el.style.strokeDasharray = '5000';
							el.style.strokeDashoffset = '5000';
						});
						let total = 0;
						anime({
							targets: mainTrunkPaths,
							strokeDashoffset: 5000,
							easing: 'linear',
							duration: 10000,
							// direction: 'alternate',
							// loop: true,
							autoplay: true
						}).finished;
						anime({
							delay: 6000,
							targets: leafPaths,
							strokeDashoffset: 4500,
							easing: 'linear',
							duration: 20000,
							// direction: 'alternate',
							// loop: true,
							autoplay: true
						}).finished;
					});
			}
		}
	);
