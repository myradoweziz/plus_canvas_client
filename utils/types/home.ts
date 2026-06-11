export type ProductImagePayload = {
	url?: string
	path?: string
	image_url?: string
}

export interface Image {
	/** API: `{ path, url }` — основной источник URL */
	image?: ProductImagePayload
	url?: string
	path?: string
	image_url?: string
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
		slug: string
		name: string
		description: string
		image: Image
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
}
