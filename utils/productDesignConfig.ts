export type CanvasFormatId =
	| 'kare'
	| 'yatay'
	| 'dikey'
	| 'yatay-2-1'
	| 'panorama-3-1'
	| 'dikey-1-2'
	| 'dikey-1-3'

export type CanvasFormat = {
	id: CanvasFormatId
	label: string
	/** width / height */
	aspect: number
}

export type PrintSizeOption = {
	id: string
	label: string
	widthCm: number
	heightCm: number
}

export type FrameOption = {
	id: string
	label: string
	/** null = çerçeve yok */
	src: string | null
	borderWidth?: number
}

/** Ana ürün sayfası: Boyut / alt format şeridi */
export const MAIN_CANVAS_FORMATS: CanvasFormat[] = [
	{ id: 'dikey', label: 'Dikey', aspect: 3 / 4 },
	{ id: 'kare', label: 'Kare', aspect: 1 },
	{ id: 'yatay', label: 'Yatay', aspect: 4 / 3 },
	{ id: 'yatay-2-1', label: 'Yatay 2/1', aspect: 2 }
]

export const CANVAS_FORMATS: CanvasFormat[] = [
	{ id: 'kare', label: 'Kare', aspect: 1 },
	{ id: 'yatay', label: 'Yatay', aspect: 4 / 3 },
	{ id: 'dikey', label: 'Dikey', aspect: 3 / 4 },
	{ id: 'yatay-2-1', label: 'Yatay 2/1', aspect: 2 },
	{ id: 'panorama-3-1', label: 'Panorama 3/1', aspect: 3 },
	{ id: 'dikey-1-2', label: 'Dikey 1/2', aspect: 1 / 2 },
	{ id: 'dikey-1-3', label: 'Dikey 1/3', aspect: 1 / 3 }
]

export const PRINT_SIZES: PrintSizeOption[] = [
	{ id: '30x20', label: '30 x 20cm', widthCm: 30, heightCm: 20 },
	{ id: '25x25', label: '25 x 25cm', widthCm: 25, heightCm: 25 },
	{ id: '30x40', label: '30 x 40cm', widthCm: 30, heightCm: 40 },
	{ id: '40x30', label: '40 x 30cm', widthCm: 40, heightCm: 30 },
	{ id: '50x40', label: '50 x 40cm', widthCm: 50, heightCm: 40 },
	{ id: '60x40', label: '60 x 40cm', widthCm: 60, heightCm: 40 }
]

export const FRAME_OPTIONS: FrameOption[] = [
	{ id: 'none', label: 'Çerçeve yok', src: null },
	{ id: 'wood-light', label: 'Açık ahşap', src: '/images/cerceve.png', borderWidth: 14 },
	{ id: 'wood-dark', label: 'Koyu ahşap', src: '/images/cerceve.png', borderWidth: 14 },
	{ id: 'black', label: 'Siyah', src: '/images/cerceve.png', borderWidth: 12 },
	{ id: 'white', label: 'Beyaz', src: '/images/cerceve.png', borderWidth: 12 },
	{ id: 'gold', label: 'Altın', src: '/images/cerceve.png', borderWidth: 14 },
	{ id: 'silver', label: 'Gümüş', src: '/images/cerceve.png', borderWidth: 12 },
	{ id: 'natural', label: 'Doğal', src: '/images/cerceve.png', borderWidth: 14 },
	{ id: 'walnut', label: 'Ceviz', src: '/images/cerceve.png', borderWidth: 14 }
]

export function printBoxInViewport(
	aspect: number,
	maxW: number,
	maxH: number
): { width: number; height: number } {
	let width = maxW
	let height = width / aspect
	if (height > maxH) {
		height = maxH
		width = height * aspect
	}
	return { width, height }
}
