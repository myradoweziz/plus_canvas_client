export interface Address {
	id: number
	address: string
	city: string
	is_default: boolean
}

export interface User {
	name: string
	email: string
	phone_number: string
	roles: string[]
	addresses: Address[]
}

/** PUT /api/auth/profile — şifre boşsa gönderilmez */
export interface ProfileUpdatePayload {
	name: string
	email: string
	phone_number: string
	password?: string
	password_confirmation?: string
}

export interface LoginResponse {
	message: string
	token: string
	user: User
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
