import { hasAuthToken, useAuthCookie } from '~/utils/authCookie'

/** Защита /profile/* — проверка cookie на сервере и клиенте до рендера страницы. */
export default defineNuxtRouteMiddleware((to) => {
	if (!to.path.startsWith('/profile')) return

	const token = useAuthCookie()
	if (hasAuthToken(token.value)) return

	return navigateTo('/login', { replace: true })
})
