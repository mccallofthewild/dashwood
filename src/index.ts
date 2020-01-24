import './polyfills';
import { State, Action, rootStore } from './rootStore';
import { AppService } from './services/AppService';

const service = new AppService();

document.querySelectorAll('form').forEach(f =>
	f.addEventListener('submit', e => {
		e.preventDefault();
		console.log(f);
		console.log('prevented default');
	})
);

rootStore.addListener(console.log);

service.init().then(() => {
	service.generateThrowawayWallet();
});

const els = new Proxy({} as { [key: string]: HTMLElement }, {
	get(target, prop, receiver) {
		return document.querySelector(`[ref="${String(prop)}"]`);
	}
});
