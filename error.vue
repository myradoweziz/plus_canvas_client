<script setup lang="ts">
	import type { NuxtError } from '#app'
	import type { ContactInfo } from '~/utils/types'

	const props = defineProps({
		error: Object as () => NuxtError
	})

	const config = useRuntimeConfig()

	type ContactInfoApiResponse = { data: ContactInfo }
	const { data: contactInfoData } = await useFetch<ContactInfoApiResponse>('/api/contact-info', {
		baseURL: config.public.baseUrl,
		method: 'GET'
	})

	const contactInfo = computed<ContactInfo>(() => contactInfoData.value?.data ?? ({} as ContactInfo))

	const homeStore = useHomeStore()
	const cartStore = useCartStore()
	const wishlistStore = useWishlistStore()

	onMounted(() => {
		void homeStore.ensureCategoryMenuData()
		void cartStore.fetchCart()
		void wishlistStore.fetchWishlist()
	})

	const handleError = () => clearError({ redirect: '/' })

	useHead({
		title: 'Sayfa Bulunamadı - 404 | PlusCanvas'
	})
</script>

<template>
	<div class="min-h-screen flex flex-col bg-white">
		<the-header :contact-info="contactInfo" />
		
		<main class="flex-1 flex flex-col items-center justify-center">
			<error-404 :status-code="error?.statusCode || 404" @home="handleError" />
		</main>

		<the-footer :contact-info="contactInfo" />
		<cart-drawer />
	</div>
</template>
