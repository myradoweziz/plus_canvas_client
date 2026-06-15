<script setup lang="ts">
	import { ref, onMounted } from 'vue'
	import Icon from '~/utils/ui/Icon.vue'

	definePageMeta({
		layout: 'account'
	})

	useHead({ title: 'Kuponlarım | PlusCanvas' })

	interface Coupon {
		id: number
		code: string
		is_percentage: boolean
		amount: number
		min_order_amount: number | null
		end_date: string | null
		is_active: boolean
	}

	const coupons = ref<Coupon[]>([])
	const isLoading = ref(true)

	const fetchCoupons = async () => {
		isLoading.value = true
		try {
			const { data, error } = await useCustomFetch<{ data: Coupon[] }>('/api/user/coupons')
			if (!error.value && data.value) {
				coupons.value = data.value.data
			}
		} catch (err) {
			console.error(err)
		} finally {
			isLoading.value = false
		}
	}

	onMounted(fetchCoupons)

	const formatAmount = (coupon: Coupon) => {
		if (coupon.is_percentage) {
			return `%${Number(coupon.amount)}`
		}
		return `${Number(coupon.amount)} ₺`
	}

	const copyCode = async (code: string) => {
		const { $toast } = useNuxtApp()
		try {
			await navigator.clipboard.writeText(code)
			$toast.success('Kupon kodu kopyalandı!')
		} catch (err) {
			$toast.error('Kopyalama başarısız oldu.')
		}
	}

	const formatDate = (dateString: string | null) => {
		if (!dateString) return 'Süresiz'
		const date = new Date(dateString)
		return new Intl.DateTimeFormat('tr-TR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date)
	}
</script>

<template>
	<section class="bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] p-6 md:p-8 min-h-[320px] h-full">
		<h2 class="text-2xl font-bold text-[#101828] mb-4">Kuponlarım</h2>

		<div v-if="isLoading" class="mt-8 flex justify-center">
			<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2B7FFF]"></div>
		</div>

		<div v-else-if="coupons.length === 0" class="mt-12 flex flex-col items-center text-center">
			<div class="w-20 h-20 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-4">
				<Icon name="ticket" class="w-10 h-10 text-gray-400" />
			</div>
			<p class="text-gray-500 font-medium">Şu anda size özel tanımlanmış bir kupon bulunmamaktadır.</p>
		</div>

		<div v-else class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
			<div v-for="coupon in coupons" :key="coupon.id" class="bg-[#155DFC1A] p-5 rounded-2xl flex flex-col relative overflow-hidden group">
				<div class="absolute -right-4 -top-4 w-16 h-16 bg-[#2B7FFF] rounded-full opacity-10 blur-xl group-hover:scale-150 transition-transform duration-500"></div>
				
				<p
					class="text-[#2B7FFF] border-dashed border-2 border-[#155DFC4D] text-lg md:text-xl font-bold bg-white w-max px-4 py-2 rounded-full cursor-pointer hover:bg-gray-50 transition-colors"
					@click="copyCode(coupon.code)"
					title="Kopyalamak için tıklayın"
				>
					{{ coupon.code }}
				</p>
				
				<p class="text-[#101828] text-3xl font-bold mt-4">{{ formatAmount(coupon) }} İndirim</p>
				
				<p class="text-[#4A5565] text-sm mt-2 flex-1">
					<span v-if="coupon.min_order_amount > 0">
						{{ Number(coupon.min_order_amount) }}₺ ve üzeri alışverişlerinizde geçerlidir.
					</span>
					<span v-else>
						Tüm alışverişlerinizde kullanabilirsiniz.
					</span>
				</p>

				<div class="mt-4 border-t border-[#d9dbdf] pt-4 flex items-center justify-between">
					<p class="text-[#4A5565] text-sm font-medium">Son kullanma: {{ formatDate(coupon.end_date) }}</p>
					<button @click="copyCode(coupon.code)" class="text-[#2B7FFF] text-sm font-bold hover:text-[#1853a0] transition-colors flex items-center gap-1">
						<Icon name="copy" class="w-4 h-4" /> Kopyala
					</button>
				</div>
			</div>
		</div>
	</section>
</template>
