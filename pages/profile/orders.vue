<script setup lang="ts">
	import { ref, onMounted } from 'vue'
	import Icon from '~/utils/ui/Icon.vue'

	definePageMeta({
		layout: 'account'
	})

	useHead({ title: 'Siparişlerim | PlusCanvas' })

	interface OrderItem {
		id: number
		canvas_product_id: number
		quantity: number
		price: number
		total: number
		canvas_product: {
			name: string
			image: any
		}
	}

	interface Order {
		id: number
		order_number: string
		created_at: string
		total: number
		delivery_status: string
		order_status: string
		items: OrderItem[]
		expanded?: boolean
	}

	const OrderStatusMap: Record<string, string> = {
		pending: 'Hazırlanıyor',
		processing: 'Hazırlanıyor',
		shipped: 'Kargoda',
		delivered: 'Teslim Edildi',
		returned: 'İade Edildi',
		cancelled: 'İptal Edildi'
	}

	const orderStatusClass = (status: string) => {
		if (status === 'delivered') return 'bg-[#DCFCE7] text-[#008236]'
		if (status === 'cancelled' || status === 'returned') return 'bg-[#FEE2E2] text-[#DC2626]'
		if (status === 'shipped') return 'bg-[#E0F2FE] text-[#0284C7]'
		return 'bg-[#FEF9C2] text-[#A65F00]' // pending, processing
	}

	const orders = ref<Order[]>([])
	const isLoading = ref(true)

	const fetchOrders = async () => {
		isLoading.value = true
		try {
			const { data, error } = await useCustomFetch<Order[]>('/api/orders')
			if (!error.value && data.value) {
				orders.value = data.value.map(o => ({ ...o, expanded: false }))
			}
		} catch (err) {
			console.error(err)
		} finally {
			isLoading.value = false
		}
	}

	onMounted(fetchOrders)

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return new Intl.DateTimeFormat('tr-TR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date)
	}

	const formatPrice = (price: number | any) => {
		return Number(price || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })
	}

	const toggleOrder = (order: Order) => {
		order.expanded = !order.expanded
	}
</script>

<template>
	<section class="bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] p-6 md:p-8 min-h-[320px] h-full">
		<h2 class="text-2xl font-bold text-[#101828] mb-6">Siparişlerim</h2>

		<div v-if="isLoading" class="mt-8 flex justify-center">
			<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2B7FFF]"></div>
		</div>

		<div v-else-if="orders.length === 0" class="mt-12 flex flex-col items-center text-center">
			<div class="w-20 h-20 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-4">
				<Icon name="basket" class="w-10 h-10 text-gray-400" />
			</div>
			<p class="text-gray-500 font-medium mb-6">Henüz hiç siparişiniz bulunmuyor.</p>
			<nuxt-link
				to="/products"
				class="bg-[#2B7FFF] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#1853a0] transition-colors shadow-md"
			>
				Alışverişe Başla
			</nuxt-link>
		</div>

		<section v-else class="flex flex-col gap-6">
			<div v-for="order in orders" :key="order.id" class="border border-gray-100 shadow-[0px_4px_15px_0px_#00000014] rounded-2xl overflow-hidden transition-all duration-300 hover:border-gray-200">
				<div class="p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div class="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8">
						<div>
							<p class="text-[#6A7282] text-xs font-medium uppercase tracking-wider mb-1">Sipariş No</p>
							<p class="text-[#101828] text-sm font-bold">#{{ order.order_number }}</p>
						</div>
						<div class="hidden sm:block w-px h-8 bg-gray-200"></div>
						<div>
							<p class="text-[#6A7282] text-xs font-medium uppercase tracking-wider mb-1">Tarih</p>
							<p class="text-[#101828] text-sm font-bold">{{ formatDate(order.created_at) }}</p>
						</div>
						<div class="hidden sm:block w-px h-8 bg-gray-200"></div>
						<div>
							<p class="text-[#6A7282] text-xs font-medium uppercase tracking-wider mb-1">Tutar</p>
							<p class="text-[#101828] text-sm font-bold">{{ formatPrice(order.total) }}₺</p>
						</div>
					</div>

					<div class="flex flex-col sm:flex-row items-center gap-4">
						<span 
							class="text-xs font-bold px-3 py-1.5 rounded-full" 
							:class="orderStatusClass(order.order_status === 'cancelled' ? 'cancelled' : order.delivery_status)"
						>
							{{ OrderStatusMap[order.order_status === 'cancelled' ? 'cancelled' : order.delivery_status] || order.delivery_status }}
						</span>
						
						<button
							@click="toggleOrder(order)"
							class="w-full sm:w-auto font-semibold px-5 py-2.5 rounded-full bg-[#155DFC1A] text-[#2B7FFF] flex items-center justify-center gap-2 hover:bg-[#2B7FFF] hover:text-white transition-all group"
						>
							Detaylar
							<Icon 
								name="chevronDown" 
								class="w-4 h-4 transition-transform duration-300" 
								:class="{ 'rotate-180': order.expanded, 'group-hover:text-white': true }"
							/>
						</button>
					</div>
				</div>

				<!-- Order Items Dropdown -->
				<div 
					v-show="order.expanded" 
					class="border-t border-gray-100 bg-gray-50/50 p-6 flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out]"
				>
					<div 
						v-for="item in order.items" 
						:key="item.id" 
						class="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
					>
						<div class="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
							<Icon v-if="!item.canvas_product" name="image" class="w-6 h-6 text-gray-400" />
							<div v-else class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300">
								<!-- We would put item preview here if we had item options preview handling -->
							</div>
						</div>
						
						<div class="flex-1 min-w-0">
							<h4 class="text-sm font-bold text-gray-900 truncate">
								{{ item.canvas_product?.name || 'Ürün' }}
							</h4>
							<p class="text-xs text-gray-500 mt-1">
								Adet: {{ item.quantity }} x {{ formatPrice(item.price) }}₺
							</p>
						</div>

						<div class="font-bold text-[#101828]">
							{{ formatPrice(item.total) }}₺
						</div>
					</div>
				</div>
			</div>
		</section>
	</section>
</template>

<style scoped>
@keyframes fadeIn {
	from { opacity: 0; transform: translateY(-5px); }
	to { opacity: 1; transform: translateY(0); }
}
</style>
