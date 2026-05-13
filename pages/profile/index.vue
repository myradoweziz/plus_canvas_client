<script setup lang="ts">
	import { storeToRefs } from 'pinia'

	import FormInput from '~/utils/ui/FormInput.vue'
	import Icon from '~/utils/ui/Icon.vue'
	import UiButton from '~/utils/ui/UiButton.vue'

	definePageMeta({
		layout: 'account'
	})

	useHead({ title: 'Profil Bilgilerim | PlusCanvas' })

	const authStore = useAuthStore()
	const { user } = storeToRefs(authStore)

	const isEditing = ref(false)
	const isSaving = ref(false)

	const form = ref({
		name: '',
		email: '',
		phone_number: '',
		password: '',
		password_confirmation: ''
	})

	const touched = ref({
		name: false,
		email: false,
		phone: false,
		password: false,
		password_confirmation: false
	})

	const syncFormFromUser = () => {
		if (!user.value) return
		form.value = {
			name: user.value.name ?? '',
			email: user.value.email ?? '',
			phone_number: user.value.phone_number ?? '',
			password: '',
			password_confirmation: ''
		}
		touched.value = {
			name: false,
			email: false,
			phone: false,
			password: false,
			password_confirmation: false
		}
	}

	watch(
		user,
		() => {
			if (!isEditing.value) syncFormFromUser()
		},
		{ immediate: true }
	)

	onMounted(async () => {
		const token = useCookie('Authorization')
		const router = useRouter()
		if (!token.value) {
			router.push('/login')
		}

		if (!user.value) {
			await authStore.getMe()
		}
		syncFormFromUser()
	})

	const nameError = computed(() => {
		if (!isEditing.value || !touched.value.name) return null
		const v = form.value.name.trim()
		if (!v) return 'Ad Soyad zorunludur.'
		if (v.length < 2) return 'Ad Soyad çok kısa.'
		return null
	})

	const emailError = computed(() => {
		if (!isEditing.value || !touched.value.email) return null
		const v = form.value.email.trim()
		if (!v) return 'E-posta zorunludur.'
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Geçerli bir e-posta girin.'
		return null
	})

	const phoneError = computed(() => {
		if (!isEditing.value || !touched.value.phone) return null
		const v = form.value.phone_number.trim()
		if (!v) return 'Telefon zorunludur.'
		const digits = v.replace(/\D/g, '')
		if (digits.length < 10) return 'Geçerli bir telefon numarası girin.'
		return null
	})

	const passwordError = computed(() => {
		if (!isEditing.value || !touched.value.password) return null
		const p = form.value.password
		const c = form.value.password_confirmation
		if (!p && !c) return null
		if (p && p.length < 6) return 'Şifre en az 6 karakter olmalıdır.'
		if (p && p !== c) return 'Şifreler eşleşmiyor.'
		return null
	})

	const passwordConfirmError = computed(() => {
		if (!isEditing.value || !touched.value.password_confirmation) return null
		const p = form.value.password
		const c = form.value.password_confirmation
		if (!p && !c) return null
		if (p && c && p !== c) return 'Şifreler eşleşmiyor.'
		return null
	})

	const isFormValid = computed(
		() =>
			!nameError.value && !emailError.value && !phoneError.value && !passwordError.value && !passwordConfirmError.value
	)

	const startEdit = () => {
		syncFormFromUser()
		isEditing.value = true
	}

	const cancelEdit = () => {
		isEditing.value = false
		syncFormFromUser()
	}

	const handleSubmit = async () => {
		touched.value = {
			name: true,
			email: true,
			phone: true,
			password: true,
			password_confirmation: true
		}
		if (!isFormValid.value) return

		const pwd = form.value.password.trim()
		if (pwd && pwd !== form.value.password_confirmation.trim()) return

		isSaving.value = true
		try {
			const ok = await authStore.updateProfile({
				name: form.value.name,
				email: form.value.email,
				phone_number: form.value.phone_number,
				...(pwd ? { password: pwd, password_confirmation: form.value.password_confirmation.trim() } : {})
			})
			if (ok) {
				isEditing.value = false
				syncFormFromUser()
			}
		} finally {
			isSaving.value = false
		}
	}
</script>

<template>
	<section class="bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] p-6 md:p-8 min-h-[320px] h-full">
		<header class="flex items-center justify-between gap-4 mb-6">
			<h2 class="text-2xl font-bold text-[#101828]">Profil Bilgilerim</h2>
			<button
				v-if="!isEditing"
				type="button"
				class="bg-[#F3F4F6] text-[#0A0A0A] px-4 py-2 rounded-full flex items-center gap-2 hover:bg-[#E5E7EB] transition-all duration-300 shrink-0"
				@click="startEdit"
			>
				<Icon name="edit" class="w-5 h-5" />
				<span>Düzenle</span>
			</button>
			<div v-else class="flex items-center gap-2 shrink-0">
				<UiButton type="button" variant="secondary" size="md" @click="cancelEdit"> İptal </UiButton>
				<UiButton type="button" size="md" :disabled="isSaving || !isFormValid" @click="handleSubmit"> Kaydet </UiButton>
			</div>
		</header>

		<div v-if="!user" class="text-[#4A5565]">Yükleniyor…</div>

		<template v-else>
			<!-- Görüntüleme -->
			<div v-if="!isEditing" class="space-y-6">
				<div>
					<p class="font-semibold text-[#364153] text-sm mb-1">Ad Soyad</p>
					<p class="text-[#101828] text-base">{{ user.name }}</p>
				</div>
				<div>
					<p class="font-semibold text-[#364153] text-sm mb-1">E-posta</p>
					<p class="text-[#101828] text-base">{{ user.email }}</p>
				</div>
				<div>
					<p class="font-semibold text-[#364153] text-sm mb-1">Telefon</p>
					<p class="text-[#101828] text-base">{{ user.phone_number }}</p>
				</div>
			</div>

			<!-- Düzenleme -->
			<form v-else class="space-y-5" @submit.prevent="handleSubmit">
				<FormInput
					id="profile-name"
					v-model="form.name"
					type="text"
					name="name"
					label="Ad Soyad"
					autocomplete="name"
					required
					:error="nameError ?? undefined"
					@blur="touched.name = true"
				/>
				<FormInput
					id="profile-email"
					v-model="form.email"
					type="email"
					name="email"
					label="E-posta"
					autocomplete="email"
					required
					:error="emailError ?? undefined"
					@blur="touched.email = true"
				/>
				<FormInput
					id="profile-phone"
					v-model="form.phone_number"
					type="tel"
					name="phone_number"
					label="Telefon"
					autocomplete="tel"
					required
					:error="phoneError ?? undefined"
					@blur="touched.phone = true"
				/>
				<p class="text-sm text-[#4A5565]">Şifreyi değiştirmek istemiyorsanız aşağıdaki alanları boş bırakın.</p>
				<FormInput
					id="profile-password"
					v-model="form.password"
					type="password"
					name="password"
					label="Yeni şifre"
					autocomplete="new-password"
					passwordToggle
					:error="passwordError ?? undefined"
					@blur="touched.password = true"
				/>
				<FormInput
					id="profile-password-confirm"
					v-model="form.password_confirmation"
					type="password"
					name="password_confirmation"
					label="Yeni şifre (tekrar)"
					autocomplete="new-password"
					passwordToggle
					:error="passwordConfirmError ?? undefined"
					@blur="touched.password_confirmation = true"
				/>
			</form>
		</template>
	</section>
</template>

<style lang="scss" scoped></style>
