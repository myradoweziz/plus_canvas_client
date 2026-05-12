<script setup lang="ts">
	import type { ContactInfo } from '~/utils/types'

	const config = useRuntimeConfig()

	type ContactInfoApiResponse = { data: ContactInfo }
	const { data: contactInfoData } = await useFetch<ContactInfoApiResponse>('/api/contact-info', {
		baseURL: config.public.baseUrl,
		method: 'GET'
	})

	const contactInfo = computed<ContactInfo>(() => contactInfoData.value?.data ?? ({} as ContactInfo))
</script>

<template>
	<div class="min-h-screen flex flex-col bg-[#F5F2ED]">
		<the-header :contact-info="contactInfo" />

		<section class="flex-1">
			<header class="bg-white border-b border-gray-100">
				<div class="max-w-[1400px] mx-auto px-4 md:px-10 py-10 md:py-8">
					<h1 class="text-3xl md:text-4xl font-bold text-[#101828] mb-2">Hesabım</h1>
					<p class="text-[#4A5565]">Siparişlerinizi ve hesap bilgilerinizi yönetin</p>
				</div>
			</header>

			<div class="max-w-[1400px] mx-auto px-4 md:px-10 py-10 md:py-8 flex flex-col lg:flex-row gap-8 lg:gap-10">
				<profile-sidebar class="shrink-0" />
				<div class="flex-1 min-w-0">
					<slot />
				</div>
			</div>
		</section>

		<the-footer :contact-info="contactInfo" />
	</div>
</template>

<style scoped></style>
