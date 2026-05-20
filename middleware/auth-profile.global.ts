/** Защита /profile/* — проверка cookie на сервере и клиенте до рендера страницы. */
export default defineNuxtRouteMiddleware((to) => {
	if (!to.path.startsWith('/profile')) return

	const token = useCookie('Authorization')
	if (token.value) return

	return navigateTo('/login', { replace: true })
})
