<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	definePageMeta({
		layout: 'account'
	})

	useHead({ title: 'Siparişlerim | PlusCanvas' })

	type OrderStatus = 'pending' | 'shipped' | 'delivered'

	const OrderStatus = {
		pending: 'Hazırlanıyor',
		shipped: 'Kargoda',
		delivered: 'Teslim Edildi'
	}

	const orderStatus: OrderStatus = 'delivered'

	const orderStatusClass = (status: OrderStatus) => {
		return [
			status === 'delivered'
				? 'bg-[#DCFCE7] text-[#008236]'
				: status === 'pending'
					? 'bg-[#FEF9C2] text-[#A65F00]'
					: 'bg-[#155DFC1A] text-[#1447E6]'
		]
	}

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
		<h2 class="text-2xl font-bold text-[#101828] mb-6">Siparişlerim</h2>

		<section class="flex flex-col gap-4">
			<div v-for="order in 10" :key="order" class="shadow-[0px_4px_15px_0px_#00000014] p-6 rounded-2xl">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-[#6A7282] text-sm">Sipariş No: #2024-001</p>
						<p class="text-[#6A7282] text-base">12 Mart 2026</p>
					</div>
					<button class="text-sm font-bold px-4 py-2 rounded-full" :class="orderStatusClass(orderStatus)">
						{{ OrderStatus[orderStatus] }}
					</button>
				</div>
				<div class="flex items-center justify-between mt-4 border-t border-[#E4E7EC] pt-4">
					<div>
						<p class="text-[#6A7282] text-sm">3 Ürün</p>
						<p class="text-[#101828] text-lg font-bold">1299₺</p>
					</div>
					<button
						class="font-semibold px-4 py-2 rounded-full bg-[#2B7FFF] text-white flex items-center gap-2 hover:bg-[#1853a0] transition-all"
					>
						Siparişi Görüntüle

						<Icon name="arrowRight" class="w-4 h-4" />
					</button>
				</div>
			</div>
		</section>
	</section>
</template>
