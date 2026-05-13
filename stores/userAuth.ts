import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProfileUpdatePayload, User } from '~/utils/types'

export const useAuthStore = defineStore('auth', () => {
	/** Дублирует значение cookie `Authorization` (без префикса Bearer) — для плагина и UI */
	const authorizationToken = ref<string | null>(null)

	const user = ref<User | null>(null)

	function authCookie() {
		return useCookie<string | null>('Authorization', {
			path: '/',
			sameSite: 'lax',
			// Сессионная cookie легко воспринимается как "не сохранилось" после перезапуска браузера.
			// Дадим разумный срок жизни.
			maxAge: 60 * 60 * 24 * 30,
			secure: !import.meta.dev
		})
	}

	function syncTokenFromCookie() {
		const tokenCookie = authCookie()
		authorizationToken.value = tokenCookie.value ?? null
	}

	function setSessionToken(token: string) {
		const tokenCookie = authCookie()
		tokenCookie.value = token
		authorizationToken.value = token
	}

	async function getMe() {
		syncTokenFromCookie()
		const toast = useNuxtApp().$toast
		const { data, error } = await useCustomFetch<{ data: User }>('/api/auth/me')

		if (error.value) {
			toast.error('Kullanıcı bilgileri alınamadı')
			return
		}

		user.value = data.value?.data ?? null
	}

	async function updateProfile(payload: ProfileUpdatePayload): Promise<boolean> {
		syncTokenFromCookie()
		const toast = useNuxtApp().$toast
		const body: Record<string, string> = {
			name: payload.name.trim(),
			email: payload.email.trim(),
			phone_number: payload.phone_number.trim()
		}
		const pwd = payload.password?.trim()
		if (pwd) {
			body.password = pwd
			body.password_confirmation = (payload.password_confirmation ?? '').trim()
		}

		const { data, error } = await useCustomFetch<{ data: User }>('/api/auth/profile', {
			method: 'PUT',
			body
		})

		if (error.value) {
			toast.error('Profil güncellenemedi')
			return false
		}

		user.value = data.value?.data ?? user.value
		toast.success('Profil güncellendi')
		return true
	}

	function setUserActivity(milliseconds: string) {
		localStorage.setItem('auth.person_last_activity', milliseconds)
	}

	async function logout(reason: 'manual' | 'expired' | 'forbidden' = 'manual', redirectTo: string | false = '/') {
		const toast = useNuxtApp().$toast
		const tokenCookie = authCookie()
		tokenCookie.value = null
		syncTokenFromCookie()
		user.value = null

		if (reason === 'expired') {
			toast.info('Sessiýaňyz gutardy. Ulgama täzeden girmegiňizi haýyş edýäris!')
		} else if (reason === 'forbidden') {
			toast.error('Giriş izni ýok. Täzeden giriň.')
		} else {
			toast.success('Çykış edildi')
		}

		// Даём UI шанс обновиться до навигации (важно для меню профиля)
		await nextTick()
		if (redirectTo !== false) {
			await navigateTo(redirectTo)
		}
	}

	return {
		authorizationToken,
		user,
		syncTokenFromCookie,
		setSessionToken,
		setUserActivity,
		logout,
		getMe,
		updateProfile
	}
})
