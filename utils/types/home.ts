export interface Image {
	url: string
	path: string
	/** Динамический room-mockup (перекраска стены, дивана и т.д.) */
	dynamic?: boolean
	scene?: import('./mockupScene').MockupScene
	mockup_scene?: import('./mockupScene').MockupScene
}

export interface Banner {
	id: number
	title: string
	description: string
	image: string
	image_url: string
	url: string
	product?: {
		id: number
		name: string
		description: string
		images: Image[]
	}
}

export interface Stock {
	id: number
	title: string
	description: string
	image: string
	image_url: string
}

export interface Faq {
	question: string
	answer: string
	id: number
}
