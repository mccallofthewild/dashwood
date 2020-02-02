import { TransferStage, rootStore } from './rootStore';
import { Transitions } from './utils/Transitions';

let backgroundImages = [];

if (process.env.NODE_ENV != 'test') {
	// @ts-ignore
	const context = require.context('./assets/backgrounds', false);
	backgroundImages = context.keys().map(filename => context(filename).default);
}

backgroundImages.forEach(src => {
	const el = document.createElement('img');
	el.setAttribute('src', src);
});

rootStore.addListener((state, action) => {
	if (action[0] != 'SET_TRANSFER_STAGE') return;
	console.log(els.appContainer);
	backgroundImages.unshift(backgroundImages.pop());
	setTimeout(() => {
		Transitions.anime.set(els.appContainer, {
			backgroundImage: backgroundImages
				.slice(0, 2)
				.map(img => `url(${img})`)
				.join(','),
			backgroundColor: 'black'
		});
	}, 500);
});

class TransitionHandler {
	static duration: 1000;
	static async beforeEnter() {
		console.log('beforeEnter', arguments);
	}
	static async enter(el, done) {
		done();
		console.log('enter', arguments);
	}
	static async afterEnter() {
		console.log('afterenter', arguments);
	}
	static async enterCancelled() {
		console.log('after cancel', arguments);
	}
	static async beforeLeave() {
		console.log('before leave', arguments);
	}
	static async leave(el, done) {
		done();
		console.log('leave', arguments);
	}
	static async afterLeave() {
		console.log('after leave', arguments);
	}
	static async leaveCancelled() {
		console.log('leave cancelled', arguments);
	}
}
export const TransferStageTransitions: {
	readonly [Stage in TransferStage]: TransitionHandler;
} = {
	HOME_STAGE: class extends TransitionHandler {
		static async beforeEnter() {}
		static async enter(el, done) {
			await Transitions.FLIP(
				els.rootLogo as HTMLElement,
				els.homeLogo as HTMLElement
			);
		}
		static async leave(el, done) {
			const transitions = [];
			if (rootStore.currentState.transferStage == 'TOKEN_SELECT_STAGE') {
				transitions.push(
					Transitions.FLIP(
						els.homeContinue as HTMLElement,
						els.selectTokenContinue as HTMLElement
					)
				);
			} else {
				transitions.push(
					Transitions.anime({
						targets: els.homeContinue,
						opacity: [1, 0]
					})
				);
			}
			transitions.push(
				Transitions.FLIP(
					els.homeLogo as HTMLElement,
					els.rootLogo as HTMLElement
				)
			);
			await Promise.all(transitions);
			done();
		}
	},
	TOKEN_SELECT_STAGE: class extends TransitionHandler {
		static async enter(el, done) {
			done();
			console.log('entering!!!');
		}
	},
	DEPOSIT_STAGE: TransitionHandler,
	PROCESSING_SABLIER_STAGE: TransitionHandler,
	SABLIER_SUCCESS_STAGE: TransitionHandler
} as const;

const els = {
	get appContainer() {
		return document.querySelector('.app-container');
	},
	// ROOT (APP LEVEL)
	get rootLogoContainer() {
		return document.querySelector(`[role='root--logo-container']`);
	},
	get rootLogo() {
		return document.querySelector(`[role=root--logo]`);
	},
	// HOME
	get homeStep() {
		return document.querySelector(`[role='steps--home']`);
	},
	get homeContinue() {
		return document.querySelector(`[role='home--continue']`);
	},
	get homeLogo() {
		return document.querySelector(`[role='home--logo']`);
	},
	// SELECT TOKEN
	get selectTokenStep() {
		return document.querySelector(`[role=steps--select-token]`);
	},
	get selectTokenSelect() {
		return document.querySelector(`[role="select-token--select"]`);
	},
	get selectTokenForm() {
		return document.querySelector(`[role="select-token--form"]`);
	},
	get selectTokenContinue() {
		return document.querySelector(`[role="select-token--continue" ]`);
	},
	// DEPOSIT FUNDS
	get depositFundsStep() {
		return document.querySelector(`[role="steps--deposit-funds"]`);
	},
	get depositFundsAddress() {
		return document.querySelector(`[role="deposit-funds--address"]`);
	},
	get depositFundsQrCode() {
		return document.querySelector(`[role="deposit-funds--qrcode"]`);
	},
	get depositFundsContinue() {
		return document.querySelector(`[role="deposit-funds--continue"]`);
	},
	get depositFundsTokenName() {
		return document.querySelector(`[role="deposit-funds--token-name"]`);
	},
	// INPUTS (MISC)
	get startDateInput() {
		return document.querySelector(`#start-date-input`);
	},
	get endDateInput() {
		return document.querySelector(`#end-date-input`);
	},
	get tokenDepositQuantityInput() {
		return document.querySelector(`#token-quantity-input`);
	},
	get receiverAddressInput() {
		return document.querySelector(`#receiver-address-input`);
	}
};
