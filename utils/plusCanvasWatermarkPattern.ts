/** Плитка для повторяющегося фона PlusCanvas (иконка + текст из логотипа). */
export function createPlusCanvasWatermarkTile(): Promise<HTMLCanvasElement> {
	return new Promise((resolve, reject) => {
		const tileW = 300
		const tileH = 110
		const canvas = document.createElement('canvas')
		canvas.width = tileW
		canvas.height = tileH
		const ctx = canvas.getContext('2d')
		if (!ctx) {
			reject(new Error('Canvas 2D недоступен'))
			return
		}

		const logo = new Image()
		logo.crossOrigin = 'anonymous'
		logo.onload = () => {
			const drawW = 200
			const drawH = (logo.height / logo.width) * drawW
			ctx.clearRect(0, 0, tileW, tileH)
			ctx.globalAlpha = 0.3
			ctx.drawImage(logo, (tileW - drawW) / 2, (tileH - drawH) / 2, drawW, drawH)
			resolve(canvas)
		}
		logo.onerror = () => reject(new Error('Логотип PlusCanvas не загрузился'))
		logo.src = '/images/icons/plus_logo.svg'
	})
}
