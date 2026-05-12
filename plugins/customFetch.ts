export default defineNuxtPlugin(() => {
	const userAuth = useCookie('Authorization')
	const config = useRuntimeConfig()
	const authStore = useAuthStore()
	const nuxtApp = useNuxtApp()
	const toast = nuxtApp.$toast
	const route = useRoute()
	const router = useRouter()

	const $customFetch = $fetch.create({
		baseURL: (config.public.baseUrl as string) ?? '',
		onRequest({ request, options, error }) {
			nuxtApp.callHook('page:loading:start')
			const rawToken = userAuth.value || authStore.authorizationToken
			if (rawToken) {
				options.headers.set('Authorization', `Bearer ${rawToken}`)
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
				if (response.url === '/api/login') {
					toast.error(response._data.message || response._data || 'Siziň rugsadyňyz ýok!')
				} else {
					toast.info('Sessiýaňyz gutardy. Ulgama täzeden girmegiňizi haýyş edýäris!')
					authStore.logout()
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
				authStore.logout()
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
