<script setup lang="ts">
	import FormInput from '~/utils/ui/FormInput.vue'
	import UiButton from '~/utils/ui/UiButton.vue'

	import type { LoginResponse, RegisterForm } from '~/utils/types'

	useHead({
		title: 'Kayıt Ol | PlusCanvas'
	})

	const form = ref<RegisterForm>({
		name: '',
		email: '',
		password: '',
		passwordConfirm: '',
		phone: ''
	})

	const touched = ref({
		name: false,
		email: false,
		phone: false,
		password: false,
		passwordConfirm: false
	})

	const isSubmitting = ref(false)
	const submitError = ref<string | null>(null)
	const backendErrors = ref<Record<string, string[]>>({})
	const toast = useNuxtApp().$toast

	const extractBackendErrors = (err: unknown): Record<string, string[]> => {
		const anyErr = err as any
		const payload = anyErr?.data ?? anyErr?.response?._data ?? anyErr?.response?._data?.data ?? anyErr

		const maybeErrors = payload?.errors ?? payload?.data ?? payload?.data?.errors
		if (maybeErrors && typeof maybeErrors === 'object') return maybeErrors as Record<string, string[]>
		return {}
	}

	const toastBackendErrors = (errors: Record<string, string[]>) => {
		Object.values(errors).forEach((messages) => {
			if (!Array.isArray(messages)) return
			messages.forEach((msg) => {
				if (typeof msg === 'string' && msg.trim()) toast.error(msg)
			})
		})
	}

	const nameError = computed(() => {
		const v = form.value.name.trim()
		if (!touched.value.name) return null
		if (!v) return 'Ad Soyad zorunludur.'
		if (v.length < 2) return 'Ad Soyad çok kısa.'
		return null
	})

	const emailError = computed(() => {
		const v = form.value.email.trim()
		if (!touched.value.email) return null
		if (!v) return 'E-posta zorunludur.'
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Geçerli bir e-posta girin.'
		return null
	})

	const phoneError = computed(() => {
		const v = form.value.phone.trim()
		if (!touched.value.phone) return null
		if (!v) return 'Telefon zorunludur.'
		// allow formats like +90, spaces, (), -, etc. Validate by digit count
		const digits = v.replace(/\D/g, '')
		if (digits.length < 8) return 'Geçerli bir telefon numarası girin.'
		return null
	})

	const passwordError = computed(() => {
		const v = form.value.password
		if (!touched.value.password) return null
		if (!v) return 'Şifre zorunludur.'
		if (v.length < 6) return 'Şifre en az 6 karakter olmalıdır.'
		return null
	})

	const passwordConfirmError = computed(() => {
		const v = form.value.passwordConfirm
		if (!touched.value.passwordConfirm) return null
		if (!v) return 'Şifre tekrar zorunludur.'
		if (v !== form.value.password) return 'Şifreler eşleşmiyor.'
		return null
	})

	const isValid = computed(
		() =>
			!nameError.value && !emailError.value && !phoneError.value && !passwordError.value && !passwordConfirmError.value
	)
	const handleSubmit = async () => {
		touched.value.name = true
		touched.value.email = true
		touched.value.phone = true
		touched.value.password = true
		touched.value.passwordConfirm = true
		submitError.value = null
		backendErrors.value = {}

		if (!isValid.value) return

		const router = useRouter()
		const authStore = useAuthStore()

		isSubmitting.value = true
		const { data, error } = await useCustomFetch<LoginResponse>('/api/auth/register', {
			method: 'POST',
			body: form.value
		})

		if (error.value) {
			backendErrors.value = extractBackendErrors(error.value)
			toastBackendErrors(backendErrors.value)
			submitError.value = 'Kayıt başarısız. Bilgileri kontrol edin.'
			return
		}

		if (data.value) {
			authStore.setSessionToken(data.value.token)
			toast.success('Kayıt başarılı')
			router.push('/')
			return
		}

		submitError.value = 'Kayıt başarısız. Lütfen tekrar deneyin.'

		isSubmitting.value = false
	}
</script>

<template>
	<section class="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center px-4 py-12 md:py-16 bg-[#f6f9ff]">
		<div
			class="w-full max-w-[800px] bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] px-6 py-8 md:px-10 md:py-10"
		>
			<h1 class="text-2xl md:text-[26px] font-bold text-[#101828] text-center mb-8">Kayıt Ol</h1>

			<form class="space-y-5" @submit.prevent="handleSubmit">
				<FormInput
					id="register-name"
					v-model="form.name"
					type="text"
					name="name"
					label="Ad Soyad"
					placeholder="Adınız ve soyadınız"
					autocomplete="name"
					required
					:error="(nameError ?? backendErrors.name?.[0]) || undefined"
					@blur="touched.name = true"
					@update:modelValue="backendErrors.name = []"
				/>

				<FormInput
					id="register-email"
					v-model="form.email"
					type="email"
					name="email"
					label="E-posta"
					placeholder="ornek@email.com"
					autocomplete="email"
					required
					:error="(emailError ?? backendErrors.email?.[0]) || undefined"
					@blur="touched.email = true"
					@update:modelValue="backendErrors.email = []"
				/>

				<FormInput
					id="register-phone"
					v-model="form.phone"
					type="tel"
					name="phone"
					label="Telefon Numarası"
					placeholder="(555) 123-4567"
					autocomplete="tel"
					required
					:error="(phoneError ?? backendErrors.phone?.[0] ?? backendErrors.phone_number?.[0]) || undefined"
					@blur="touched.phone = true"
					@update:modelValue="backendErrors.phone = []"
				/>

				<FormInput
					id="register-password"
					v-model="form.password"
					type="password"
					name="password"
					label="Şifre"
					placeholder="••••••••"
					autocomplete="new-password"
					required
					passwordToggle
					:error="(passwordError ?? backendErrors.password?.[0]) || undefined"
					@blur="touched.password = true"
					@update:modelValue="backendErrors.password = []"
				/>

				<FormInput
					id="register-password-confirm"
					v-model="form.passwordConfirm"
					type="password"
					name="passwordConfirm"
					label="Şifre Tekrar"
					placeholder="••••••••"
					autocomplete="new-password"
					required
					passwordToggle
					:error="
						(passwordConfirmError ?? backendErrors.password_confirmation?.[0] ?? backendErrors.passwordConfirm?.[0]) ||
						undefined
					"
					@blur="touched.passwordConfirm = true"
					@update:modelValue="backendErrors.password_confirmation = []"
				/>

				<div
					v-if="submitError"
					class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
				>
					{{ submitError }}
				</div>

				<div class="flex justify-center mt-8">
					<UiButton type="submit" class="max-w-[330px]" full :disabled="isSubmitting || !isValid"> Kayıt Ol </UiButton>
				</div>
			</form>
		</div>
	</section>
</template>

<style lang="scss" scoped></style>
