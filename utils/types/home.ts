export interface Image {
	url: string
	path: string
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

export interface DisCount {
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
