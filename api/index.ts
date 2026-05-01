export interface Request {
	url: string
	method: string
	headers?: any
	params?: object
	data?: object
	isFormData?: boolean
}
const config = useRuntimeConfig()
const baseURL = config.public.baseUrl

export const request = async ({
	url,
	method = 'POST',
	headers = {},
	params = {},
	data = {},
	isFormData = false
}: Request) => {
	const finalHeaders: Record<string, string> = {
		Accept: 'application/json',
		...headers
	}

	// Авторизация
	const token = useCookie('Authorization')
	if (token.value) {
		finalHeaders['Authorization'] = token.value
	}

	// Формируем body
	let body: any = null

	if (isFormData) {
		const formData = new FormData()
		for (const [key, value] of Object.entries(data)) {
			formData.append(key, value)
		}
		body = formData
		// fetch сам установит content-type
	} else if (method !== 'GET') {
		finalHeaders['Content-Type'] = 'application/json'
		body = JSON.stringify(data)
	}

	// Генерация query строки, если есть параметры
	const query = new URLSearchParams(params as any).toString()
	const fullUrl = `${baseURL}${url}${query && `?${query}`}`

	const { data: response, error } = await useFetch(fullUrl, {
		method: method as any,
		headers: finalHeaders,
		body: isFormData ? (body as FormData) : body,
		server: true
	})

	if (error.value) {
		throw error.value
	}

	return response.value
}
