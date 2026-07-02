<script setup lang="ts">
	import { ref, onMounted } from 'vue'
	import Icon from '~/utils/ui/Icon.vue'
	import CartItemThumb from '~/components/cart/CartItemThumb.vue'

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
		preview_url?: string | null
		options?: Record<string, unknown> | null
		canvas_product: {
			name: string
			slug?: string
			image?: any
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

		<section v-else class="flex flex-col gap-5">
			<div v-for="order in orders" :key="order.id" class="border border-gray-200/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-gray-300 bg-white shadow-sm">
				<div class="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div class="flex flex-col gap-1">
						<p class="text-[#4A5565] text-sm font-medium">Sipariş No: #{{ order.order_number }}</p>
						<p class="text-[#8E8E8E] text-xs">{{ formatDate(order.created_at) }}</p>
					</div>

					<div class="flex items-center">
						<span 
							class="text-xs font-bold px-3.5 py-1 rounded-full" 
							:class="orderStatusClass(order.order_status === 'cancelled' ? 'cancelled' : order.delivery_status)"
						>
							{{ OrderStatusMap[order.order_status === 'cancelled' ? 'cancelled' : order.delivery_status] || order.delivery_status }}
						</span>
					</div>
				</div>

				<div class="border-t border-gray-100 mx-6"></div>

				<div class="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<p class="text-[#6A7282] text-xs font-medium mb-1">{{ order.items?.reduce((sum, i) => sum + i.quantity, 0) || order.items?.length || 1 }} Ürün</p>
						<p class="text-[#101828] text-lg font-bold">{{ formatPrice(order.total) }}₺</p>
					</div>

					<button
						@click="toggleOrder(order)"
						class="w-full sm:w-auto font-semibold px-5 py-2.5 rounded-full bg-[#2B7FFF] text-white flex items-center justify-center gap-1.5 hover:bg-[#1853a0] transition-all shadow-sm text-sm"
					>
						<span>Siparişi Görüntüle</span>
						<Icon 
							name="chevronRight" 
							class="w-4 h-4 transition-transform duration-300 shrink-0" 
							:class="{ 'rotate-90': order.expanded }"
						/>
					</button>
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
						<nuxt-link 
							:to="item.canvas_product?.slug ? `/products/${item.canvas_product.slug}` : '#'"
							class="w-16 h-16 rounded-lg bg-[#f3f4f6] flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 hover:opacity-80 transition-opacity"
						>
							<CartItemThumb v-if="item.canvas_product" :item="item" />
							<Icon v-else name="image" class="w-6 h-6 text-gray-400" />
						</nuxt-link>
						
						<div class="flex-1 min-w-0">
							<nuxt-link 
								:to="item.canvas_product?.slug ? `/products/${item.canvas_product.slug}` : '#'"
								class="text-sm font-bold text-gray-900 hover:text-[#2B7FFF] transition-colors truncate block"
							>
								{{ item.canvas_product?.name || 'Ürün' }}
							</nuxt-link>
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
