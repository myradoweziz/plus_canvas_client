<script setup lang="ts">
	import FormInput from '~/utils/ui/FormInput.vue'
	import UiButton from '~/utils/ui/UiButton.vue'

	import type { LoginForm, LoginResponse } from '~/utils/types'

	useHead({
		title: 'Giriş Yap | PlusCanvas'
	})

	const form = ref<LoginForm>({
		email: 'admin@pluscanvas.com',
		password: 'admin123'
	})

	const touched = ref({
		email: false,
		password: false
	})

	const isSubmitting = ref(false)
	const submitError = ref<string | null>(null)
	const toast = useNuxtApp().$toast
	const emailError = computed(() => {
		const value = form.value.email.trim()
		if (!touched.value.email) return null
		if (!value) return 'E-posta zorunludur.'
		// Simple email format check (enough for client-side)
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Geçerli bir e-posta girin.'
		return null
	})

	const passwordError = computed(() => {
		const value = form.value.password
		if (!touched.value.password) return null
		if (!value) return 'Şifre zorunludur.'
		if (value.length < 6) return 'Şifre en az 6 karakter olmalıdır.'
		return null
	})

	const isValid = computed(() => !emailError.value && !passwordError.value)

	const handleSubmit = async () => {
		touched.value.email = true
		touched.value.password = true
		submitError.value = null

		if (!isValid.value) return

		const router = useRouter()
		const authStore = useAuthStore()

		isSubmitting.value = true
		try {
			const { data, error } = await useCustomFetch<LoginResponse>('/api/auth/login', {
				method: 'POST',
				body: form.value
			})

			if (error.value) {
				submitError.value = 'Giriş yapılamadı. Bilgileri kontrol edin.'
				return
			}

			if (data.value && data.value.message === 'Successfully logged in') {
				authStore.setSessionToken(data.value.token)
				toast.success('Giriş başarılı')
				router.push('/')
				await authStore.getMe()
				return
			}

			submitError.value = 'Giriş yapılamadı. Lütfen tekrar deneyin.'
		} finally {
			isSubmitting.value = false
		}
	}
</script>

<template>
	<section class="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center px-4 py-12 md:py-16 bg-[#f6f9ff]">
		<div
			class="w-full max-w-[800px] bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] px-6 py-8 md:px-10 md:py-10"
		>
			<h1 class="text-2xl md:text-[26px] font-bold text-[#101828] text-center mb-8">Giriş Yap</h1>

			<form class="space-y-5" @submit.prevent="handleSubmit">
				<FormInput
					id="login-email"
					v-model="form.email"
					type="email"
					name="email"
					label="E-posta"
					placeholder="ornek@email.com"
					autocomplete="email"
					required
					:error="emailError ?? undefined"
					@blur="touched.email = true"
				/>

				<FormInput
					id="login-password"
					v-model="form.password"
					type="password"
					name="password"
					label="Şifre"
					placeholder="••••••••"
					autocomplete="current-password"
					required
					:error="passwordError ?? undefined"
					@blur="touched.password = true"
				/>

				<div
					v-if="submitError"
					class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
				>
					{{ submitError }}
				</div>

				<div v-if="false" class="flex justify-start">
					<nuxt-link to="/forgot-my-password" class="text-sm font-semibold text-[#2B7FFF] rounded-full hover:underline">
						Şifremi Unuttum!
					</nuxt-link>
				</div>

				<div class="flex justify-center mt-8">
					<UiButton type="submit" class="max-w-[330px]" full :disabled="isSubmitting || !isValid"> Giriş Yap </UiButton>
				</div>
			</form>

			<div class="flex justify-center mt-10">
				<nuxt-link to="/register" class="font-semibold text-[#2B7FFF] hover:underline ml-1">
					Hesabınız yok mu? Kayıt Ol
				</nuxt-link>
			</div>
		</div>
	</section>
</template>

<style lang="scss" scoped></style>
