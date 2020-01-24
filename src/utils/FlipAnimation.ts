import anime from 'animejs/lib/anime.es.js';
export class FlipAnimation {
	static async fade(target) {
		await anime({
			targets: target,
			opacity: 0,
			duration: 450
		}).finished;
	}
	static async transition(fromEl: HTMLElement, toEl: HTMLElement) {
		// get positions;
		const start = fromEl.getBoundingClientRect();
		const end = toEl.getBoundingClientRect();
		// hide the end state

		toEl.style.opacity = '0';
		fromEl.style.opacity = '1';
		// initialize as fixed in starting position
		fromEl.style.position = 'fixed';
		await anime({
			targets: fromEl,
			left: start.left,
			right: start.right,
			top: start.top,
			bottom: start.bottom,
			height: start.height,
			width: start.width,
			duration: 0
		}).finished;

		await anime({
			targets: fromEl,
			left: end.left,
			right: end.right,
			top: end.top,
			bottom: end.bottom,
			height: end.height,
			width: end.width,
			duration: 1200,
			easing: 'easeInOutCubic'
		}).finished;
		fromEl.style.opacity = '0';
		toEl.style.opacity = '1';
	}
}
