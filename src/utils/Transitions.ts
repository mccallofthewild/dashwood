import anime from 'animejs/lib/anime.es.js';
export class Transitions {
	static anime = anime;
	static async fade(target) {
		await anime({
			targets: target,
			opacity: 0,
			duration: 450
		}).finished;
	}

	static async FLIP(fromEl: HTMLElement, toEl: HTMLElement) {
		// get positions;
		const initStart = fromEl.getBoundingClientRect();
		const end = toEl.getBoundingClientRect();
		// hide the end state

		toEl.style.opacity = '0';
		fromEl.style.opacity = '1';
		console.log(initStart);
		let start = initStart;
		const scaleX = end.width / initStart.width;
		const scaleY = end.height / initStart.height;
		if (initStart.width != end.width || initStart.height != end.height) {
			anime.set(fromEl, {
				scaleX: scaleX,
				scaleY: scaleY
			});
			start = fromEl.getBoundingClientRect();
			anime.set(fromEl, {
				scaleX: 1,
				scaleY: 1
			});
		}
		await anime({
			targets: fromEl,
			scaleX,
			scaleY,
			translateY: (end.top - start.top) / scaleY,
			translateX: (end.left - start.left) / scaleX,
			duration: 1200,
			easing: 'easeInOutQuad'
		}).finished;
		fromEl.style.opacity = '0';
		toEl.style.opacity = '1';
	}
}
