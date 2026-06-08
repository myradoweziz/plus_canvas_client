export * from './category'
export * from './filter'
export * from './home'
export * from './login'
export * from './product'
export * from './mockupScene'
export * from './productDesign'
export * from './canvasProductPrice'

export interface BreadcrumbItem {
	label: string
	link?: string
}

export type ContactInfo = {
	phone_number: string
	address: string
	email: string
	logo: string
	logo_path: string
	slogan: string
}
