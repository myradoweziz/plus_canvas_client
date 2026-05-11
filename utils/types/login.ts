export interface Address {
	id: number
	address: string
	city: string
	is_default: boolean
}

export interface LoginResponse {
	message: string
	token: string
	user: {
		id: number
		name: string
		email: string
		phone_number: string
		roles: string[]
		addresses: Address[]
	}
}

export interface LoginForm {
	email: string
	password: string
}

export interface RegisterForm {
	name: string
	email: string
	password: string
	passwordConfirm: string
	phone: string
}
