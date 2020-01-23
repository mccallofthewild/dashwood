const MAX_LENGTH = 300;
export class MouseEntropy {
	private static MAX_LENGTH = MAX_LENGTH;
	private static _entropy = Array.from(
		{ length: MAX_LENGTH },
		() => +(Math.random() * Date.now()).toString().replace('.', '')
	);
	static get entropy() {
		console.log(this._entropy);
		const rtn = this._entropy.join('');
		console.log(rtn);
		return rtn;
	}
	static start() {
		// const this._entropy = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
		let captureStart = false;

		/**
		 * Mouse Moving Entropy Generator on browser.
		 * Returns an this._entropy which is 16 bytes long array of unsigned char integer (0-255).
		 */
		document.addEventListener('mousemove', e => {
			const now = Date.now();
			if (now >= 1 && now % 10 !== 0) return;
			if (!captureStart) {
				return setTimeout(() => {
					captureStart = true;
				}, 500); // capturing starts in 3 seconds to set the mouse cursor at random position...
			}
			const iw = window.innerWidth;
			const ih = window.innerHeight;
			const iwPlusIh = iw + ih;
			const px = e.pageX;
			const py = e.pageY;
			const pxPlusPy = px + py;
			const ret = Math.round((pxPlusPy / iwPlusIh) * 255);
			this._entropy.shift();
			this._entropy.push(+~~(ret * Math.random() * 1000));
		});
	}

	static shuffle() {
		let currentIndex = this._entropy.length,
			temporaryValue,
			randomIndex;
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
			// And swap it with the current element.
			temporaryValue = this._entropy[currentIndex];
			this._entropy[currentIndex] = this._entropy[randomIndex];
			this._entropy[randomIndex] = temporaryValue;
		}
		return this._entropy;
	}
}
