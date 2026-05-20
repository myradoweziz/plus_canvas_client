/** Единые опции cookie Authorization — везде один и тот же экземпляр. */
export const AUTH_COOKIE_OPTIONS = {
	path: '/',
	sameSite: 'lax' as const,
	maxAge: 60 * 60 * 24 * 30,
	secure: !import.meta.dev
}

export function useAuthCookie() {
	return useCookie<string | null>('Authorization', AUTH_COOKIE_OPTIONS)
}

export function hasAuthToken(token: string | null | undefined): boolean {
	return Boolean(String(token ?? '').trim())
}
