import './polyfills';
import { State, Action, rootStore, TransferStage } from './rootStore';
import { AppService } from './services/AppService';
import './app.scss';
import './settings.scss';
import { Erc20Data } from './utils/Erc20Data';
import * as QRCode from 'qrcode';
import { Transitions } from './utils/Transitions';
import Vue from 'vue/dist/vue.esm.js';
import Datepicker from 'vuejs-datepicker';
import BigNumber from 'bignumber.js';
import { TransactionWrapper } from './sablier/transactions/TransactionWrapper';

const TREE_IMAGE = require('./assets/tree-plain.svg').default;
const LOGO_IMAGE = require('./assets/logo.png').default;
const service = new AppService();

service.init().then(() => {
	service.loadThrowawayWallet();
});
rootStore.addListener(console.log);

export const $vm = new Vue({
	el: '#app',
	data() {
		return {
			service,
			state: rootStore.currentState,
			storeListener: null,
			images: {
				throwawayWalletQrCodeUri: null,
				LOGO_IMAGE,
				TREE_IMAGE
			},
			totalEtherFee: null,
			txSequenceCosts: null,
			txSequence: null,
			isRunningTxSequence: false
		};
	},
	mounted() {
		this.storeListener = (state: State, action: Action) => {
			const __window = window as any;
			__window.__isTransferring = __window.__isTransferring || false;
			this.$set(this, 'state', state);
			if (
				!__window.__isTransferring &&
				state.transferStage == 'DEPOSIT_STAGE' &&
				state.throwawayWallet &&
				state.throwawayWalletERC20TokenBalance &&
				state.throwawayWalletWeiBalance
			) {
				__window.__isTransferring = true;
				try {
					this.transferFundsViaMetamask();
				} catch (e) {}
			}
			if (this.etherAndTokenTransfersComplete) {
				this.runTxSequence();
			}
		};
		rootStore.addListener(this.storeListener);
		// vanilla();
	},
	destroyed() {
		rootStore.removeListener(this.storeListener);
	},
	methods: {
		onHeaderLogoClick() {
			rootStore.dispatch(['SET_TRANSFER_STAGE', 'HOME_STAGE']);
		},
		transferFundsViaMetamask() {
			return service.transferFundsToThrowawayAddress();
		},
		submitSelectTokenForm() {
			const isValidAddress = rootStore.currentState.web3.utils.isAddress(
				rootStore.currentState.sablierReceivingAddress
			);
			if (!isValidAddress) {
				return alert('Invalid Address!');
			}
			rootStore.dispatch(['SET_TRANSFER_STAGE', 'DEPOSIT_STAGE']);
		},
		continueFromHome: () =>
			rootStore.dispatch(['SET_TRANSFER_STAGE', 'TOKEN_SELECT_STAGE']),

		// SELECTING TOKEN
		selectToken(e) {
			console.log({ e });
			const tokenName = e.target.value;
			const selectedToken = Erc20Data.tokens.find(t => t.name == tokenName);
			rootStore.dispatch(['SET_ERC20_TOKEN', selectedToken]);
		},

		// DEPOSITING FUNDS
		continueFromDepositFunds() {
			rootStore.dispatch(['SET_TRANSFER_STAGE', 'FINAL_STAGE']);
		},

		onReceiverAddressInput(e) {
			if (service.web3.utils.isAddress(e.target.value.trim())) {
				rootStore.dispatch(['SET_SABLIER_RECEIVING_ADDRESS', e.target.value]);
			}
		},

		onTokenDepositQuantityInput(e) {
			rootStore.dispatch([
				'SET_SABLIER_TOKEN_DEPOSIT_QUANTITY',
				e.target.value.toString()
			]);
		},

		onStartDateInput(startDate) {
			rootStore.dispatch(['SET_SABLIER_START_DATE', startDate.toISOString()]);
		},
		onEndDateInput(v) {
			const endDate = v;
			rootStore.dispatch(['SET_SABLIER_END_DATE', endDate.toISOString()]);
		},
		async updateTotalEtherFee() {
			this.txSequence = await service.createTransactionSequence();
			return service
				.estimateTransactionSequenceCosts(this.txSequence)
				.then(costObj => {
					const totalWeiFee = costObj.totalFees.toString();
					this.txSequenceCosts = costObj.allCosts;
					this.totalEtherFee = rootStore.currentState.web3.utils.fromWei(
						totalWeiFee
					);
					return null;
				});
		},
		async runTxSequence() {
			if (this.isRunningTxSequence) return;
			this.isRunningTxSequence = true;
			console.log('\n\n\n Running Transaction Sequence \n\n\n');
			rootStore.dispatch(['SET_TRANSFER_STAGE', 'PROCESSING_SABLIER_STAGE']);
			const sequence = this.txSequence as TransactionWrapper<any, any, any>[];
			let currentTx: TransactionWrapper<any, any, any>;
			try {
				for (let index = 0; index < sequence.length; index++) {
					const tx = sequence[index];
					currentTx = tx;
					const prices = this.txSequenceCosts[index];
					console.log({ prices });
					await tx.invokeTx(prices);
				}
			} catch (e) {
				console.error(
					/**/ `👇 Why ${
						(currentTx as any).__proto__.constructor.name
					} Transaction Failed: \n`,
					e
				);
				alert(
					'Sablier transaction failed! Open developer console for details.'
				);
				rootStore.dispatch(['SET_TRANSFER_STAGE', 'DEPOSIT_STAGE']);
				this.isRunningTxSequence = false;
				return;
			}
			rootStore.dispatch(['SET_TRANSFER_STAGE', 'SABLIER_SUCCESS_STAGE']);
			this.isRunningTxSequence = false;
		}
	},
	computed: {
		tokenTransferIsComplete() {
			const state = this.state as State;
			const actualNeededBalance = service.calculateNearestValidSablierDepositAmount(
				state.sablierHumanReadableTokenDepositQuantity,
				new Date(state.sablierStartDate),
				new Date(state.sablierEndDate),
				state.erc20Token
			);
			const tokenBalance = state.throwawayWalletERC20TokenBalance;
			return new BigNumber(actualNeededBalance).lte(
				new BigNumber(tokenBalance)
			);
		},
		etherTransferIsComplete() {
			const state = this.state as State;
			const actualNeededBalance = this.totalEtherFee;
			const weiBalance = state.throwawayWalletWeiBalance;
			if (!state.web3) return false;
			if (!weiBalance) return false;
			const etherBalance = state.web3.utils.fromWei(
				state.web3.utils.toBN(weiBalance)
			);
			return new BigNumber(actualNeededBalance).lte(
				new BigNumber(etherBalance)
			);
		},
		etherAndTokenTransfersComplete() {
			const etherTransferIsComplete = this.etherTransferIsComplete;
			const tokenTransferIsComplete = this.tokenTransferIsComplete;
			const allComplete = etherTransferIsComplete && tokenTransferIsComplete;
			return allComplete;
		},
		startDateValue() {
			return new Date(this.state.sablierStartDate);
		},
		endDateValue() {
			return new Date(this.state.sablierEndDate);
		},
		minEndDate() {
			const min = new Date(
				new Date(this.state.sablierStartDate).getTime() + 60 * 60 * 1000 * 24
			);
			if (this.endDateValue < min) {
				rootStore.dispatch(['SET_SABLIER_END_DATE', min.toISOString()]);
			}
			return min;
		},
		minStartDate() {
			return new Date(new Date().getTime() + 60 * 60 * 1000);
		}
	},
	watch: {
		etherAndTokenTransfersComplete: {
			immediate: true,
			handler(allComplete: boolean, prevV: boolean) {
				console.log({ allComplete, prevV, arguments });
				if (allComplete) {
					console.log('\n\n\n Running Transaction Sequence \n\n\n');
					this.runTxSequence();
				}
			}
		},
		'state.transferStage': {
			immediate: true,
			async handler(v: TransferStage) {
				if (v != 'DEPOSIT_STAGE') return;
				await service.init();
				this.updateTotalEtherFee();
			}
		},
		'state.throwawayWallet': {
			immediate: true,
			async handler(v, prevV) {
				if (!v || (prevV && v.address == prevV.address)) return;
				await service.init();
				this.updateTotalEtherFee();
				const etherURI = `ethereum:${this.state.throwawayWallet.address}`;
				this.images.throwawayWalletQrCodeUri = await QRCode.toDataURL(
					etherURI,
					{
						scale: 10,
						margin: 2,
						color: {
							light: '#ffffff21', // Transparent background
							dark: '#FAFAFA'
						}
					}
				);
			}
		}
	},
	components: {
		Datepicker
	}
});

function vanilla() {
	let runCount = 0;
	rootStore.addListener(state => {
		if (
			state.throwawayWalletERC20TokenBalance > '0' &&
			state.throwawayWalletWeiBalance > '0' &&
			!runCount++
		) {
			// service.initiateStreamFromThrowawayWallet();
		}
	});

	type ExtendedElement = Element &
		HTMLElement & { value: any; on: (event: string, fn: Function) => void };

	const $ = (...args: [TemplateStringsArray, ...any[]]): ExtendedElement => {
		const el: ExtendedElement = document.querySelector(String.raw(...args));
		el.on = (event, fn) => {
			el.addEventListener(event, (...args) => {
				args[0].stopPropagation();
				args[0].preventDefault();
				fn(...args);
			});
		};
		return el as ExtendedElement;
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
		depositFundsTokenName: $`[role="deposit-funds--token-name"]`,
		// INPUTS (MISC)
		startDateInput: $`#start-date-input`,
		endDateInput: $`#end-date-input`,
		tokenDepositQuantityInput: $`#token-quantity-input`,
		receiverAddressInput: $`#receiver-address-input`
	};

	class Transition {
		constructor(
			public fromRoot: ExtendedElement,
			public toRoot: ExtendedElement
		) {}
		protected beforeStart() {
			this.fromRoot.setAttribute('transitioning-from', 'true');
			this.toRoot.setAttribute('transitioning-to', 'true');
		}
		protected afterEnd() {
			this.fromRoot.setAttribute('transitioning-from', 'true');
			this.toRoot.setAttribute('transitioning-to', 'true');
		}
	}
	// TRANSFER STAGE DOM REACTIONS
	rootStore.addListener(async (state, action) => {
		console.log(state, action);
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

	rootStore.addListener(async (state, action) => {
		console.log(action);
		switch (action[0]) {
			case 'SET_TRANSFER_STAGE': {
				break;
			}
			case 'SET_ERC20_TOKEN': {
				els.depositFundsTokenName.innerHTML = action[1].name;
				break;
			}
			case 'SET_THROWAWAY_WALLET': {
				if (!state.throwawayWallet) break;

				return;
			}
			case 'SET_THROWAWAY_WALLET_ETHER_BALANCE': {
				if (+action[1]) {
					// els.depositFundsStep.removeAttribute('active');
					console.log('need to get erc20 token balance too');
					console.log('need next step');
				}
				break;
			}
		}
	});

	function configureDateInputs() {}
	// Initializing DOM

	async function initalize() {
		configureDateInputs();

		els.rootLogo.on('click', async () => {
			await Transitions.anime
				.timeline({
					targets: 'main',
					easing: 'easeInOutExpo',
					// loop: true,
					// direction: 'alternate',
					duration: 450
				})
				.add({ targets: 'main *', opacity: 0 })
				.add({
					targets: 'main',
					scaleY: 0.01,
					scaleX: 1.25,
					duration: 750,
					easing: 'easeOutElastic(2, 1.2)'
					// easing: 'easeOutElastic(amplitude (overshoot): 1-10, period (back & forths): 0.1-2)'
					// easing: 'spring(mass, stiffness, damping, velocity)'
				})
				.add({
					scaleX: 0.01,
					scaleY: 0.01,
					easing: 'easeOutElastic(2, 1.1)'
				})
				.add({
					scaleX: 5,
					scaleY: 0
				}).finished;
			document.write('');
			window.location.reload();
			// rootStore.dispatch(['SET_TRANSFER_STAGE', 'HOME_STAGE']);
		});
		Erc20Data.tokens.forEach(token => {
			const option = document.createElement('option');
			option.setAttribute('value', token.name);
			option.innerHTML = token.name;
			els.selectTokenSelect.appendChild(option);
		});

		await Promise.all(
			[els.homeLogo, els.rootLogo].map(el => {
				return new Promise(r => {
					el.on('load', r);
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
					const shadow = this.attachShadow({
						mode: 'closed'
					});
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
}
