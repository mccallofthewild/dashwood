import { TransferStage, rootStore } from './rootStore';
import { Transitions } from './utils/Transitions';

const defaultTransition: Transition = {
	duration: 1000,
	async beforeEnter() {
		console.log('beforeEnter', arguments);
	},
	async enter(el, done) {
		done();
		console.log('enter', arguments);
	},
	async afterEnter() {
		console.log('afterenter', arguments);
	},
	async enterCancelled() {
		console.log('after cancel', arguments);
	},
	async beforeLeave() {
		console.log('before leave', arguments);
	},
	async leave(el, done) {
		done();
		console.log('leave', arguments);
	},
	async afterLeave() {
		console.log('after leave', arguments);
	},
	async leaveCancelled() {
		console.log('leave cancelled', arguments);
	}
};

export const TransferStageTransitions: {
	readonly [Stage in TransferStage]: Transition;
} = {
	HOME_STAGE: {
		...defaultTransition,
		async enter(el, done) {
			const prev = rootStore.currentState.prevTransferStage;
			await Transitions.FLIP(
				els.rootLogo as HTMLElement,
				els.homeLogo as HTMLElement
			);
		},
		async leave(el, done) {
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
	TOKEN_SELECT_STAGE: {
		...defaultTransition,
		async enter(el, done) {
			done();
			console.log('entering!!!');
		}
	},
	DEPOSIT_STAGE: {
		...defaultTransition
	},
	PROCESSING_SABLIER_STAGE: {
		...defaultTransition
	},
	SABLIER_SUCCESS_STAGE: {
		...defaultTransition
	}
} as const;

interface Transition {
	duration: number;
	beforeEnter(): Promise<void>;
	enter(el: HTMLElement, done: () => void): Promise<void>;
	afterEnter(): Promise<void>;
	enterCancelled(): Promise<void>;
	beforeLeave(): Promise<void>;
	leave(el: HTMLElement, done: () => void): Promise<void>;
	afterLeave(): Promise<void>;
	leaveCancelled(): Promise<void>;
}

const els = {
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
