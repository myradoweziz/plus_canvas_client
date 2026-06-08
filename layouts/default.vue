<script setup lang="ts">
	import type { ContactInfo } from '~/utils/types'

	const config = useRuntimeConfig()

	type ContactInfoApiResponse = { data: ContactInfo }
	const { data: contactInfoData } = await useFetch<ContactInfoApiResponse>('/api/contact-info', {
		baseURL: config.public.baseUrl,
		method: 'GET'
	})

	const contactInfo = computed<ContactInfo>(() => contactInfoData.value?.data ?? ({} as ContactInfo))

	const homeStore = useHomeStore()

	onMounted(() => {
		void homeStore.ensureCategoryMenuData()
	})
</script>

<template>
	<the-header :contact-info="contactInfo" />
	<slot />
	<the-footer :contact-info="contactInfo" />
</template>

<style scoped></style>
