import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProfileUpdatePayload, User } from '~/utils/types'

export const useAuthStore = defineStore('auth', () => {
	/** Дублирует значение cookie `Authorization` (без префикса Bearer) — для плагина и UI */
	const authorizationToken = ref<string | null>(null)

	const user = ref<User | null>(null)

	function syncTokenFromCookie() {
		const tokenCookie = useCookie('Authorization')
		authorizationToken.value = tokenCookie.value ?? null
	}

	function setSessionToken(token: string) {
		const tokenCookie = useCookie('Authorization')
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

	function logout() {
		const tokenCookie = useCookie('Authorization')
		tokenCookie.value = null
		syncTokenFromCookie()
		user.value = null
		void navigateTo('/')
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
