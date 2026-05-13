export default defineNuxtPlugin(() => {
	// Единственный источник токена — cookie Authorization
	const userAuth = useCookie<string | null>('Authorization', {
		path: '/',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30,
		secure: !import.meta.dev
	})
	const config = useRuntimeConfig()
	const authStore = useAuthStore()
	const nuxtApp = useNuxtApp()
	const toast = nuxtApp.$toast
	const route = useRoute()
	const router = useRouter()

	const getPathFromResponseUrl = (url: string): string => {
		try {
			// может быть абсолютный URL с baseURL
			return new URL(url).pathname
		} catch {
			// может быть относительный путь
			return url
		}
	}

	const $customFetch = $fetch.create({
		baseURL: (config.public.baseUrl as string) ?? '',
		onRequest({ request, options, error }) {
			nuxtApp.callHook('page:loading:start')
			const rawToken = typeof userAuth.value === 'string' ? userAuth.value.trim() : ''
			if (rawToken) {
				// ofetch допускает headers как объект; нормализуем в Headers, чтобы .set всегда работал
				const h = options.headers instanceof Headers ? options.headers : new Headers(options.headers as any)
				h.set('Authorization', `Bearer ${rawToken}`)
				options.headers = h
			}

			if (route.path.startsWith('/contact/') && !sessionStorage.getItem('confirm_phone')) {
				router.push('/contact')
			}

			if (request !== '/api/refresh') {
				const now = new Date().getTime()
				authStore.setUserActivity(now.toString())
			}
		},
		onResponse({ response }) {
			setTimeout(() => {
				nuxtApp.callHook('page:loading:end')
			}, 2000)
			return response._data
		},
		onResponseError({ response, options, error }) {
			if (response.status === 401) {
				const path = getPathFromResponseUrl(response.url)
				const isAuthEndpoint =
					path.includes('/api/auth/login') ||
					path.includes('/api/auth/register') ||
					path.includes('/api/auth/me') ||
					path.includes('/api/login')

				if (isAuthEndpoint) {
					toast.error(response._data.message || response._data || 'Siziň rugsadyňyz ýok!')
				} else {
					void authStore.logout('expired')
				}
			} else if (response.status === 422) {
				const errors = response._data.data
				if (errors) {
					Object.keys(errors).forEach((key) => {
						if (Array.isArray(errors[key])) {
							errors[key].forEach((value) => {
								toast.error(value)
							})
						} else {
							toast.error(errors[key])
						}
					})
				}
			} else if (response.status === 403) {
				void authStore.logout('forbidden')
			} else if (response.status === 500 && response._data?.message === 'Token has expired') {
				toast.info('Sessiýaňyz gutardy. Ulgama täzeden girmegiňizi haýyş edýäris!')
			} else if (response._data.message) {
				toast.error(response._data.message)
			} else if (response._data.data?.message) {
				toast.error(response._data.data.message)
			} else {
				toast.error(`Tehniki näsazlyk ýüze çykdy! ${response.status}: ${response.statusText}`)
			}
			if (response.status === 500 && response.url.startsWith('private-portal')) {
				navigateTo({ name: 'private-portal' })
			}
			nuxtApp.callHook('page:loading:end')
		}
	})
	return {
		provide: {
			customFetch: $customFetch
		}
	}
})
