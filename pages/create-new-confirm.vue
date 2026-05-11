<script setup lang="ts">
	useHead({
		title: 'Yeni Şifre Oluştur | PlusCanvas'
	})

	const password = ref('')
	const passwordConfirm = ref('')

	const handleSubmit = () => {}
</script>

<template>
	<section class="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center px-4 py-12 md:py-16 bg-[#f6f9ff]">
		<div
			class="w-full max-w-[800px] bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] px-6 py-8 md:px-10 md:py-10"
		>
			<h1 class="text-2xl md:text-[26px] font-bold text-[#101828] text-center mb-8">Yeni Şifre Oluştur</h1>

			<form class="space-y-6" @submit.prevent="handleSubmit">
				<div>
					<label for="login-password" class="text-sm font-medium text-[#364153] mb-2"
						>Şifre <span class="text-red-500"> *</span></label
					>
					<input
						id="login-password"
						v-model="password"
						type="password"
						name="password"
						autocomplete="current-password"
						placeholder="••••••••"
						class="w-full rounded-2xl border-2 border-[#E5E7EB] bg-white px-4 py-3.5 placeholder:text-[#98A2B3] outline-none transition-shadow"
					/>
				</div>

				<div>
					<label for="login-password" class="text-sm font-medium text-[#364153] mb-2"
						>Şifre Tekrar <span class="text-red-500"> *</span></label
					>
					<input
						id="register-password-confirm"
						v-model="passwordConfirm"
						type="password"
						name="passwordConfirm"
						autocomplete="current-password"
						placeholder="••••••••"
						class="w-full rounded-2xl border-2 border-[#E5E7EB] bg-white px-4 py-3.5 placeholder:text-[#98A2B3] outline-none transition-shadow"
					/>
				</div>

				<div class="flex justify-center">
					<button
						type="submit"
						class="w-full max-w-[330px] rounded-2xl bg-[#2B7FFF] hover:bg-[#1853a0] text-white font-semibold py-3.5 px-4 shadow-md shadow-blue-100/80 transition-all text-base"
					>
						Kayıt Ol
					</button>
				</div>
			</form>
		</div>
	</section>
</template>

<style lang="scss" scoped></style>
