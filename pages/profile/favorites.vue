<script setup lang="ts">
	definePageMeta({
		layout: 'account'
	})

	useHead({ title: 'Favorilerim | PlusCanvas' })

	const products = [
		{
			id: 1,
			name: 'Düğün Anısı Kanvas Baskı',
			price: 100,
			slug: 'düğün-anısı-kanvas-baskı',
			description: 'Düğün Anısı Kanvas Baskı',
			discount: 10,
			images: [],
			inner_images: [],
			upload_image_count: 0,
			main_category_id: 1,
			category_id: 1,
			sub_category_id: 1,
			brand_id: 1,
			banner_id: 1,
			flag: 'new',
			product_qode: '1234567890',
			discount_id: 1
		}
	]

	onMounted(async () => {
		const token = useCookie('Authorization')
		const router = useRouter()
		if (!token.value) {
			router.push('/login')
		}
	})
</script>

<template>
	<section class="bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] p-6 md:p-8 min-h-[320px] h-full">
		<h2 class="text-2xl font-bold text-[#101828] mb-4">Favorilerim (4)</h2>

		<div class="mt-6 grid grid-cols-4 gap-6">
			<cards-canvas-paintings-card v-for="(favorite, index) in products" :key="index" :product="favorite" />
		</div>
	</section>
</template>
