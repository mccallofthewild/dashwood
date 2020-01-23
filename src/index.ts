import './polyfills';
import { State, Action, rootStore } from './rootStore';
import { View } from './framework/View';

View.element = class ThrowawayWalletAddress extends View.Element {
	innerHTML = 'Not generated yet...';
	onStateChange(state: State, action: Action) {
		if (action[0] == 'SET_THROWAWAY_WALLET') {
			this.innerHTML = state.throwawayWallet.address;
		}
	}
};

View.element = class GenerateThrowawayWalletAddress extends View.Element {
	innerHTML = '<button>Generate Throwaway Address</button>';
	constructor() {
		super();
		this.addEventListener('click', () =>
			rootStore.currentState.appService.generateThrowawayWallet()
		);
	}
};

View.element = class DurationSection extends View.Element {
	innerHTML = `
		<input/>
	`;
};

View.element = class Web3DataView extends View.Element {
	innerHTML = `

	`;

	static watch = {};
	onStateChange(state: State, action: Action) {
		switch (action[0]) {
			case 'SET_WEB3': {
				this.innerHTML =
					// @ts-ignore
					state.web3.currentProvider.selectedAddress;
			}
		}
	}
	constructor() {
		super();
	}
};

View.element = class RootApp extends View.Element {
	innerHTML = `
	<!-- Metamask Wallet Address <web3-data-view></web3-data-view> -->
	<div>
		<ol>
			<li>
					Generate Throwaway Wallet
				 	<generate-throwaway-wallet-address></generate-throwaway-wallet-address> 
				</li>
				<li>
					Send funds to: 
					<throwaway-wallet-address><throwaway-wallet-address/>
			</li>
		</ol>
	</div>
	`;
	constructor() {
		super();
		this.$store.currentState.appService.init();
	}
};

View.mount();

// const sabContract: Sablier = new web3.eth.Contract(SABLIER_ABI);
