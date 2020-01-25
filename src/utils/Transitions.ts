import anime from 'animejs/lib/anime.es.js';
export class Transitions {
	static async fade(target) {
		await anime({
			targets: target,
			opacity: 0,
			duration: 450
		}).finished;
	}

	static async freezeAll(selector) {
		[...document.querySelectorAll(selector)]
			.map(el => ({
				el,
				rect: el.getBoundingClientRect()
			}))
			.forEach(({ el, rect }) => {
				el.style.position = 'fixed';
				['left', 'right', 'top', 'bottom', 'width', 'height'].forEach(
					measure => {
						el.style.setProperty(measure, rect[measure] + 'px');
					}
				);
			});
	}

	static async FLIPWithTransform(fromEl: HTMLElement, toEl: HTMLElement) {
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
			console.log('matching sizes for ', fromEl);
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
		console.log('init vs now', initStart, start);
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
	static async FLIP(fromEl: HTMLElement, toEl: HTMLElement) {
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
			easing: 'easeInOutCirc'
		}).finished;
		fromEl.style.opacity = '0';
		toEl.style.opacity = '1';
	}
}
