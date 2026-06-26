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
	const cartStore = useCartStore()
	const wishlistStore = useWishlistStore()

	onMounted(() => {
		void homeStore.ensureCategoryMenuData()
		void cartStore.fetchCart()
		void wishlistStore.fetchWishlist()
	})
</script>

<template>
	<div class="min-h-screen flex flex-col">
		<the-header :contact-info="contactInfo" />
		
		<main class="flex-1 flex flex-col">
			<NuxtLayout>
				<NuxtPage />
			</NuxtLayout>
		</main>

		<the-footer :contact-info="contactInfo" />
		<cart-drawer />
	</div>
</template>
