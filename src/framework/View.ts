import { rootStore, State, Action } from '../rootStore';

abstract class BaseElement extends HTMLElement {
	static is?: string;
	__proto__: {
		constructor: typeof BaseElement;
	};
	// props/attributes to watch
	static watch?: {
		[key: string]: (this: BaseElement, newValue: any, oldValue: any) => any;
	} = {};
	public onStateChange?(state: State, action: Action): any;
	public onPropChange?(name: string, oldValue: any, newValue: any): any;
	readonly $store = rootStore;

	static get observedAttributes() {
		return Object.keys(this.watch);
	}

	private tryParse(val) {
		try {
			const parsed = JSON.parse(val);
			return parsed;
		} catch (e) {
			return val;
		}
	}

	protected attributeChangedCallback(name, oldValue, newValue) {
		this.__proto__.constructor.watch[name].bind(this)(
			this.tryParse(newValue),
			this.tryParse(oldValue)
		);
	}
	constructor() {
		super();
		if (this.onStateChange) {
			const storeListener = (state, action) => {
				this.onStateChange(state, action);
			};
			rootStore.addListener(storeListener);
		}
	}
}

export class View {
	static readonly Element = BaseElement;
	private static components: {
		[key: string]: typeof BaseElement;
	} = {
		// Web3DataView,
		// RootApp
	};

	static mount() {
		Object.entries(this.components).forEach(([key, val]) => {
			window.customElements.define(CaseConverter.camelToKebab(key), val);
		});
	}

	static set element(v: typeof BaseElement) {
		window.customElements.define(
			CaseConverter.camelToKebab(v.name),
			v,
			v.is ? { extends: v.is } : undefined
		);
	}
}

class CaseConverter {
	static camelToKebab(string: string) {
		return string
			.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
			.replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
			.toLowerCase();
	}
}
