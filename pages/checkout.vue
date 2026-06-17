<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/userAuth'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const currentStep = ref(1) // 1: Teslimat, 2: Ödeme, 3: Onay
const isSubmitting = ref(false)

const form = reactive({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postal_code: '',
    address_note: '',
    shipping_method: 'standart', // standart, hizli
    payment_method: 'credit_card', // credit_card, bank_transfer, cash_on_delivery
})

const orderResult = ref<any>(null)
const paytrToken = ref<string | null>(null)

const couponCode = ref('')
const appliedCoupon = ref<{ code: string, discount_amount: number } | null>(null)
const isApplyingCoupon = ref(false)

onMounted(async () => {
    if (!cartStore.cartItems.length) {
        await cartStore.fetchCart()
    }
    if (authStore.user) {
        // Pre-fill user data
        const names = authStore.user?.name?.split(' ') || []
        form.first_name = names[0] || ''
        form.last_name = names.slice(1).join(' ') || ''
        form.email = authStore.user?.email || ''
        form.phone = (authStore.user as any)?.phone_number || ''
    }
    
    // Add PayTR iframe resizer script
    if (import.meta.client) {
        const script = document.createElement('script')
        script.src = 'https://www.paytr.com/js/iframeResizer.min.js'
        script.async = true
        document.head.appendChild(script)
    }
})

const shippingCost = computed(() => {
    if (form.shipping_method === 'hizli') return 50
    return 0
})

const totalAmount = computed(() => {
    let t = cartStore.subtotal + shippingCost.value
    if (appliedCoupon.value) {
        t -= appliedCoupon.value.discount_amount
    }
    return Math.max(0, t)
})

const applyCoupon = async () => {
    if (!couponCode.value) return
    isApplyingCoupon.value = true
    try {
        const { $customFetch, $toast } = useNuxtApp()
        const res: any = await $customFetch('/api/orders/apply-coupon', {
            method: 'POST',
            body: {
                coupon_code: couponCode.value,
                subtotal: cartStore.subtotal
            }
        })
        if (res && res.success) {
            appliedCoupon.value = {
                code: couponCode.value,
                discount_amount: res.discount_amount
            }
            if ($toast) $toast.success('Kupon başarıyla uygulandı!')
        } else {
            if ($toast) $toast.error(res?.message || 'Geçersiz kupon kodu.')
        }
    } catch (err: any) {
        const { $toast } = useNuxtApp()
        if ($toast) $toast.error(err?.response?._data?.message || 'Kupon uygulanamadı.')
    } finally {
        isApplyingCoupon.value = false
    }
}

const removeCoupon = () => {
    appliedCoupon.value = null
    couponCode.value = ''
}

const showValidationErrors = ref(false)

const goToPayment = () => {
    showValidationErrors.value = true
    // Basic validation
    if (!form.first_name || !form.last_name || !form.phone || !form.email || !form.address || !form.city || !form.district) {
        const { $toast } = useNuxtApp()
        if ($toast) $toast.error('Lütfen zorunlu alanları doldurun.')
        return
    }
    currentStep.value = 2
}

const submitOrder = async () => {
    if (isSubmitting.value) return
    if (!cartStore.cartItems.length) return
    
    isSubmitting.value = true
    try {
        const { $customFetch, $toast } = useNuxtApp()
        
        // Prepare items array
        const items = cartStore.cartItems.map((item) => ({
            canvas_product_id: item.canvas_product_id,
            quantity: item.quantity,
            price: item.unit_price,
            total: item.unit_price * item.quantity,
            options: item.options
        }))

        const payload = {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            district: form.district,
            postal_code: form.postal_code,
            address_note: form.address_note,
            shipping_method: form.shipping_method,
            payment_method: form.payment_method === 'credit_card' ? 'paytr' : form.payment_method,
            subtotal: cartStore.subtotal,
            shipping_cost: shippingCost.value,
            total: totalAmount.value,
            items: items,
            coupon_code: appliedCoupon.value ? appliedCoupon.value.code : null,
        }

        const headers: any = {}
        if (cartStore.sessionId) {
            headers['X-Session-ID'] = cartStore.sessionId
        }

        const res: any = await $customFetch('/api/orders', {
            method: 'POST',
            body: payload,
            headers
        })

        if (res && res.success) {
            orderResult.value = res.order
            
            // If paytr token is returned, show iframe
            if (res.paytr_token) {
                paytrToken.value = res.paytr_token
                // Wait for Vue to render iframe, then init resizer
                setTimeout(() => {
                    if ((window as any).iFrameResize) {
                        (window as any).iFrameResize({}, '#paytriframe')
                    }
                }, 500)
            } else {
                // Clear cart
                cartStore.cartItems = []
                cartStore.subtotal = 0
                cartStore.total = 0
                currentStep.value = 3
            }
        } else {
            if ($toast) $toast.error(res?.message || 'Sipariş oluşturulamadı.')
        }

    } catch (err: any) {
        const { $toast } = useNuxtApp()
        if ($toast) $toast.error(err?.response?._data?.message || 'Sipariş oluşturulurken bir hata oluştu.')
    } finally {
        isSubmitting.value = false
    }
}

const formatPrice = (price: number) => {
    return price.toLocaleString('tr-TR', { maximumFractionDigits: 0 })
}

const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('tr-TR', options)
}

const getDeliveryDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + (form.shipping_method === 'hizli' ? 3 : 7))
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return date.toLocaleDateString('tr-TR', options)
}
</script>

<template>
    <div class="min-h-screen bg-[#F8F8F5] pb-20">
        <!-- Progress Steps -->
        <div class="bg-white py-4 shadow-sm relative z-10">
            <div class="container mx-auto max-w-5xl px-4">
                <div class="flex items-center justify-center gap-4 sm:gap-8">
                    <!-- Step 1 -->
                    <div class="flex items-center gap-2" :class="currentStep >= 1 ? 'text-[#2B7FFF]' : 'text-gray-400'">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                            :class="currentStep > 1 ? 'bg-[#22C55E] text-white' : currentStep === 1 ? 'bg-[#2B7FFF] text-white' : 'bg-gray-100 text-gray-500'">
                            <Icon name="check" class="w-5 h-5" v-if="currentStep > 1" />
                            <Icon name="box" class="w-4 h-4" v-else />
                        </div>
                        <span class="font-semibold text-sm hidden sm:block">Teslimat</span>
                        <Icon name="chevronRight" class="w-4 h-4 text-gray-300 ml-2 sm:ml-4" />
                    </div>
                    
                    <!-- Step 2 -->
                    <div class="flex items-center gap-2" :class="currentStep >= 2 ? 'text-[#2B7FFF]' : 'text-gray-400'">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                            :class="currentStep > 2 ? 'bg-[#22C55E] text-white' : currentStep === 2 ? 'bg-[#2B7FFF] text-white' : 'bg-gray-100 text-gray-500'">
                            <Icon name="check" class="w-5 h-5" v-if="currentStep > 2" />
                            <Icon name="creditCard" class="w-4 h-4" v-else />
                        </div>
                        <span class="font-semibold text-sm hidden sm:block">Ödeme</span>
                        <Icon name="chevronRight" class="w-4 h-4 text-gray-300 ml-2 sm:ml-4" />
                    </div>
                    
                    <!-- Step 3 -->
                    <div class="flex items-center gap-2" :class="currentStep === 3 ? 'text-[#2B7FFF]' : 'text-gray-400'">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                            :class="currentStep === 3 ? 'bg-[#2B7FFF] text-white' : 'bg-gray-100 text-gray-500'">
                            <Icon name="checkCircle" class="w-4 h-4" />
                        </div>
                        <span class="font-semibold text-sm hidden sm:block">Onay</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mx-auto max-w-5xl px-4 mt-8">
            <!-- If Empty Cart (and not in success step) -->
            <div v-if="!cartStore.cartItems.length && currentStep !== 3" class="bg-white rounded-2xl p-12 text-center shadow-sm">
                <Icon name="basket" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 class="text-xl font-bold text-gray-900 mb-2">Sepetiniz Boş</h2>
                <p class="text-gray-500 mb-6">Sipariş verebilmek için önce sepetinize ürün eklemelisiniz.</p>
                <NuxtLink to="/products" class="inline-flex items-center justify-center bg-[#2B7FFF] text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors">
                    Alışverişe Başla
                </NuxtLink>
            </div>

            <div v-else class="flex flex-col lg:flex-row gap-8">
                <!-- LEFT COLUMN -->
                <div class="flex-1">
                    <!-- STEP 1: TESLIMAT -->
                    <div v-if="currentStep === 1" class="bg-white rounded-2xl p-6 shadow-sm">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">Teslimat Bilgileri</h2>
                        
                        <div class="space-y-5">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-1">Ad Soyad <span class="text-red-500">*</span></label>
                                <div class="flex gap-4">
                                    <input v-model="form.first_name" type="text" placeholder="Adınız" class="w-full border rounded-lg px-4 py-3 outline-none transition-colors" :class="showValidationErrors && !form.first_name ? 'border-red-500' : 'border-gray-200 focus:border-[#2B7FFF]'" />
                                    <input v-model="form.last_name" type="text" placeholder="Soyadınız" class="w-full border rounded-lg px-4 py-3 outline-none transition-colors" :class="showValidationErrors && !form.last_name ? 'border-red-500' : 'border-gray-200 focus:border-[#2B7FFF]'" />
                                </div>
                            </div>
                            
                            <div class="flex flex-col sm:flex-row gap-4">
                                <div class="flex-1">
                                    <label class="block text-sm font-bold text-gray-700 mb-1">Telefon Numarası <span class="text-red-500">*</span></label>
                                    <input v-model="form.phone" type="tel" placeholder="(555) 123-4567" class="w-full border rounded-lg px-4 py-3 outline-none transition-colors" :class="showValidationErrors && !form.phone ? 'border-red-500' : 'border-gray-200 focus:border-[#2B7FFF]'" />
                                </div>
                                <div class="flex-1">
                                    <label class="block text-sm font-bold text-gray-700 mb-1">E-posta <span class="text-red-500">*</span></label>
                                    <input v-model="form.email" type="email" placeholder="ornek@email.com" class="w-full border rounded-lg px-4 py-3 outline-none transition-colors" :class="showValidationErrors && !form.email ? 'border-red-500' : 'border-gray-200 focus:border-[#2B7FFF]'" />
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-1">Adres <span class="text-red-500">*</span></label>
                                <textarea v-model="form.address" rows="3" placeholder="Tam adresinizi yazınız" class="w-full border rounded-lg px-4 py-3 outline-none resize-none transition-colors" :class="showValidationErrors && !form.address ? 'border-red-500' : 'border-gray-200 focus:border-[#2B7FFF]'"></textarea>
                            </div>
                            
                            <div class="flex flex-col sm:flex-row gap-4">
                                <div class="flex-1">
                                    <label class="block text-sm font-bold text-gray-700 mb-1">Şehir <span class="text-red-500">*</span></label>
                                    <input v-model="form.city" type="text" placeholder="İstanbul" class="w-full border rounded-lg px-4 py-3 outline-none transition-colors" :class="showValidationErrors && !form.city ? 'border-red-500' : 'border-gray-200 focus:border-[#2B7FFF]'" />
                                </div>
                                <div class="flex-1">
                                    <label class="block text-sm font-bold text-gray-700 mb-1">İlçe <span class="text-red-500">*</span></label>
                                    <input v-model="form.district" type="text" placeholder="Kadıköy" class="w-full border rounded-lg px-4 py-3 outline-none transition-colors" :class="showValidationErrors && !form.district ? 'border-red-500' : 'border-gray-200 focus:border-[#2B7FFF]'" />
                                </div>
                                <div class="flex-1">
                                    <label class="block text-sm font-bold text-gray-700 mb-1">Posta Kodu</label>
                                    <input v-model="form.postal_code" type="text" placeholder="34000" class="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#2B7FFF] transition-colors" />
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-1">Adres Notu <span class="text-gray-400 font-normal">(Opsiyonel)</span></label>
                                <input v-model="form.address_note" type="text" placeholder="Kapı kodu, bina adı vb." class="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#2B7FFF] transition-colors" />
                            </div>
                        </div>

                        <h3 class="text-lg font-bold text-gray-900 mt-10 mb-4">Teslimat Seçenekleri</h3>
                        <div class="space-y-3">
                            <label @click="form.shipping_method = 'standart'" class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors"
                                :class="form.shipping_method === 'standart' ? 'border-[#2B7FFF] bg-[#2B7FFF]/5' : 'border-gray-200 hover:border-gray-300'">
                                <div class="flex items-center gap-3">
                                    <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="form.shipping_method === 'standart' ? 'border-[#2B7FFF]' : 'border-gray-300'">
                                        <div class="w-2.5 h-2.5 rounded-full bg-[#2B7FFF]" v-if="form.shipping_method === 'standart'"></div>
                                    </div>
                                    <div>
                                        <div class="font-bold text-gray-900">Standart Teslimat</div>
                                        <div class="text-sm text-gray-500">5-7 iş günü içinde</div>
                                    </div>
                                </div>
                                <div class="font-bold text-[#22C55E]">Ücretsiz</div>
                            </label>
                            
                            <label @click="form.shipping_method = 'hizli'" class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors"
                                :class="form.shipping_method === 'hizli' ? 'border-[#2B7FFF] bg-[#2B7FFF]/5' : 'border-gray-200 hover:border-gray-300'">
                                <div class="flex items-center gap-3">
                                    <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="form.shipping_method === 'hizli' ? 'border-[#2B7FFF]' : 'border-gray-300'">
                                        <div class="w-2.5 h-2.5 rounded-full bg-[#2B7FFF]" v-if="form.shipping_method === 'hizli'"></div>
                                    </div>
                                    <div>
                                        <div class="font-bold text-gray-900">Hızlı Teslimat</div>
                                        <div class="text-sm text-gray-500">2-3 iş günü içinde</div>
                                    </div>
                                </div>
                                <div class="font-bold text-gray-900">₺50</div>
                            </label>
                        </div>
                    </div>

                    <!-- STEP 2: ÖDEME -->
                    <div v-else-if="currentStep === 2" class="bg-white rounded-2xl p-6 shadow-sm">
                        <div class="flex items-center gap-3 mb-6">
                            <button @click="currentStep = 1" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                                <Icon name="arrowLeft" class="w-4 h-4" />
                            </button>
                            <h2 class="text-2xl font-bold text-gray-900">Ödeme Yöntemi</h2>
                        </div>
                        
                        <div v-if="paytrToken" class="mt-4 animate-fade-in">
                            <iframe :src="'https://www.paytr.com/odeme/guvenli/' + paytrToken" id="paytriframe" frameborder="0" scrolling="no" style="width: 100%;"></iframe>
                        </div>

                        <div v-else class="space-y-3 mb-8">
                            <label @click="form.payment_method = 'credit_card'" class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors"
                                :class="form.payment_method === 'credit_card' ? 'border-[#2B7FFF] bg-[#2B7FFF]/5' : 'border-gray-200 hover:border-gray-300'">
                                <div class="flex items-center gap-4">
                                    <Icon name="creditCard" class="w-6 h-6 text-gray-600" />
                                    <div>
                                        <div class="font-bold text-gray-900">Kredi Kartı</div>
                                        <div class="text-sm text-gray-500">Visa, Mastercard (PayTR Güvencesiyle)</div>
                                    </div>
                                </div>
                                <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="form.payment_method === 'credit_card' ? 'border-[#2B7FFF]' : 'border-gray-300'">
                                    <div class="w-2.5 h-2.5 rounded-full bg-[#2B7FFF]" v-if="form.payment_method === 'credit_card'"></div>
                                </div>
                            </label>
                            
                            <label @click="form.payment_method = 'bank_transfer'" class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors"
                                :class="form.payment_method === 'bank_transfer' ? 'border-[#2B7FFF] bg-[#2B7FFF]/5' : 'border-gray-200 hover:border-gray-300'">
                                <div class="flex items-center gap-4">
                                    <Icon name="building" class="w-6 h-6 text-gray-600" />
                                    <div>
                                        <div class="font-bold text-gray-900">Banka Havalesi</div>
                                        <div class="text-sm text-gray-500">IBAN ile havale</div>
                                    </div>
                                </div>
                                <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="form.payment_method === 'bank_transfer' ? 'border-[#2B7FFF]' : 'border-gray-300'">
                                    <div class="w-2.5 h-2.5 rounded-full bg-[#2B7FFF]" v-if="form.payment_method === 'bank_transfer'"></div>
                                </div>
                            </label>

                            <label @click="form.payment_method = 'cash_on_delivery'" class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors"
                                :class="form.payment_method === 'cash_on_delivery' ? 'border-[#2B7FFF] bg-[#2B7FFF]/5' : 'border-gray-200 hover:border-gray-300'">
                                <div class="flex items-center gap-4">
                                    <Icon name="wallet" class="w-6 h-6 text-gray-600" />
                                    <div>
                                        <div class="font-bold text-gray-900">Kapıda Ödeme</div>
                                        <div class="text-sm text-gray-500">Nakit veya kart</div>
                                    </div>
                                </div>
                                <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" :class="form.payment_method === 'cash_on_delivery' ? 'border-[#2B7FFF]' : 'border-gray-300'">
                                    <div class="w-2.5 h-2.5 rounded-full bg-[#2B7FFF]" v-if="form.payment_method === 'cash_on_delivery'"></div>
                                </div>
                            </label>
                        </div>

                        <div v-if="!paytrToken && form.payment_method === 'credit_card'" class="bg-blue-50 p-4 rounded-lg border border-blue-100 animate-fade-in text-center">
                            <Icon name="shieldCheck" class="w-12 h-12 text-[#2B7FFF] mx-auto mb-3" />
                            <p class="text-sm text-blue-800 font-medium">Siparişi Tamamla butonuna tıkladığınızda 256-bit SSL sertifikalı güvenli PayTR ödeme sayfasına yönlendirileceksiniz.</p>
                        </div>
                        
                        <div v-else-if="!paytrToken && form.payment_method === 'bank_transfer'" class="bg-blue-50 p-4 rounded-lg border border-blue-100 animate-fade-in">
                            <p class="text-sm text-blue-800">Siparişi tamamladıktan sonra banka hesap bilgilerimiz ekranda gösterilecek ve e-posta adresinize gönderilecektir. Havale işleminiz onaylandığında siparişiniz işleme alınacaktır.</p>
                        </div>
                        
                        <div v-else-if="form.payment_method === 'cash_on_delivery'" class="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fade-in">
                            <p class="text-sm text-gray-700">Ürünlerinizi teslim alırken kapıda nakit veya kredi kartı ile ödeme yapabilirsiniz. Kapıda ödeme hizmet bedeli yansıtılabilir.</p>
                        </div>
                    </div>

                    <!-- STEP 3: ONAY (SUCCESS) -->
                    <div v-else-if="currentStep === 3" class="bg-white rounded-2xl p-8 shadow-sm text-center">
                        <div class="w-16 h-16 bg-[#22C55E]/10 text-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="checkCircle" class="w-8 h-8" />
                        </div>
                        <h2 class="text-3xl font-bold text-gray-900 mb-2">Siparişiniz Alındı!</h2>
                        <p class="text-gray-500 mb-8">Teşekkür ederiz, siparişiniz başarıyla oluşturuldu.</p>
                        
                        <div class="bg-[#F8F9FA] rounded-xl p-6 text-left mb-8 max-w-lg mx-auto">
                            <h3 class="font-bold text-gray-900 mb-4 border-b pb-2">Sipariş Detayları</h3>
                            <div class="space-y-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Sipariş Numarası:</span>
                                    <span class="font-bold text-gray-900">{{ orderResult?.order_number }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Sipariş Tarihi:</span>
                                    <span class="font-bold text-gray-900">{{ orderResult ? formatDate(orderResult.created_at) : '-' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Toplam Tutar:</span>
                                    <span class="font-bold text-[#2B7FFF]">₺{{ orderResult ? formatPrice(orderResult.total) : '-' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Ödeme Yöntemi:</span>
                                    <span class="font-bold text-gray-900">
                                        {{ orderResult?.payment_method === 'credit_card' ? 'Kredi Kartı' : (orderResult?.payment_method === 'bank_transfer' ? 'Banka Havalesi' : 'Kapıda Ödeme') }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-center gap-3 text-blue-800 text-sm mb-8 max-w-lg mx-auto">
                            <Icon name="truck" class="w-5 h-5 text-blue-600" />
                            <span>Siparişiniz <strong>{{ getDeliveryDate() }}</strong> tarihinde teslim edilecektir.</span>
                        </div>

                        <div class="text-left max-w-lg mx-auto border-t pt-8">
                            <h3 class="font-bold text-gray-900 mb-4">Müşteri Bilgileri</h3>
                            <div class="text-sm text-gray-700 space-y-2">
                                <p><strong class="text-gray-900">Ad Soyad:</strong> {{ orderResult?.first_name }} {{ orderResult?.last_name }}</p>
                                <p><strong class="text-gray-900">Telefon:</strong> {{ orderResult?.phone }}</p>
                                <p><strong class="text-gray-900">E-posta:</strong> {{ orderResult?.email }}</p>
                                <p><strong class="text-gray-900">Adres:</strong> {{ orderResult?.address }}, {{ orderResult?.district }}/{{ orderResult?.city }} {{ orderResult?.postal_code }}</p>
                            </div>
                        </div>

                        <div class="text-left max-w-lg mx-auto border-t pt-8 mt-8">
                            <h3 class="font-bold text-gray-900 mb-4">Sipariş İçeriği</h3>
                            <div class="space-y-4">
                                <div v-for="item in orderResult?.items" :key="item.id" class="flex gap-4">
                                    <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        <img :src="cartStore.getItemPreview(item.id) || item.canvas_product?.image || '/placeholder.png'" class="w-full h-full object-cover" />
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex justify-between items-start">
                                            <div class="font-bold text-gray-900 text-sm">{{ item.canvas_product?.name || 'Ürün' }}</div>
                                            <div class="font-bold text-gray-900 text-sm">₺{{ formatPrice(item.total) }}</div>
                                        </div>
                                        <div class="text-xs text-gray-500 mt-1">
                                            <span v-if="item.options?.canvas_size_id">{{ item.options.canvas_size_id }} cm • </span>
                                            <span v-if="item.options?.canvas_frame_id">Çerçeve • </span>
                                            Adet: {{ item.quantity }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-center gap-4 mt-10">
                            <NuxtLink to="/products" class="px-6 py-3 rounded-lg font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors">
                                Alışverişe Devam Et
                            </NuxtLink>
                            <NuxtLink to="/profile/orders" class="px-6 py-3 rounded-lg font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                                Siparişlerim
                            </NuxtLink>
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: SİPARİŞ ÖZETİ (Hide on Step 3 unless you want to show it) -->
                <div v-if="currentStep !== 3" class="w-full lg:w-[380px] shrink-0">
                    <div class="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
                        <h3 class="font-bold text-lg text-gray-900 mb-4">Sipariş Özeti</h3>
                        
                        <!-- Items -->
                        <div class="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            <div v-for="item in cartStore.cartItems" :key="item.id" class="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                <div class="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                                    <img :src="cartStore.getItemPreview(item.id) || item.canvas_product?.image || '/placeholder.png'" class="w-full h-full object-cover" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex justify-between items-start gap-2">
                                        <div class="font-bold text-gray-900 text-xs truncate leading-tight">{{ item.canvas_product?.name }}</div>
                                        <div class="font-bold text-gray-900 text-xs shrink-0">₺{{ formatPrice((item.unit_price || 0) * item.quantity) }}</div>
                                    </div>
                                    <div class="text-[10px] text-gray-500 mt-1 leading-tight">
                                        <div v-if="item.resolved_options?.canvas_size">{{ item.resolved_options.canvas_size.display_name }}</div>
                                        <div v-if="item.resolved_options?.canvas_frame">{{ item.resolved_options.canvas_frame.name }}</div>
                                        <div v-else>Çerçevesiz</div>
                                        <div class="mt-0.5 text-gray-600">Adet: {{ item.quantity }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Coupon Input -->
                        <div class="mb-6">
                            <div class="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                                <Icon name="ticket" class="w-4 h-4" />
                                Kupon Kodu Var mı?
                            </div>
                            <div v-if="appliedCoupon" class="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200">
                                <div class="font-bold text-sm">{{ appliedCoupon.code }}</div>
                                <button @click="removeCoupon" class="text-green-800 hover:text-green-900 text-xs underline font-semibold">İptal</button>
                            </div>
                            <div v-else class="flex gap-2">
                                <input v-model="couponCode" type="text" placeholder="KUPON KODU" class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2B7FFF] uppercase" />
                                <button @click="applyCoupon" :disabled="!couponCode || isApplyingCoupon" class="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors">
                                    {{ isApplyingCoupon ? '...' : 'Uygula' }}
                                </button>
                            </div>
                        </div>
                        
                        <!-- Totals -->
                        <div class="space-y-3 text-sm border-t border-gray-100 pt-4 mb-4">
                            <div class="flex justify-between text-gray-500">
                                <span>Ara Toplam</span>
                                <span>₺{{ formatPrice(cartStore.subtotal) }}</span>
                            </div>
                            <div class="flex justify-between" :class="shippingCost > 0 ? 'text-gray-500' : 'text-[#22C55E] font-semibold'">
                                <span>Kargo</span>
                                <span>{{ shippingCost > 0 ? '₺' + formatPrice(shippingCost) : 'Ücretsiz' }}</span>
                            </div>
                            <div v-if="appliedCoupon" class="flex justify-between text-[#2B7FFF]">
                                <span>İndirim ({{ appliedCoupon.code }})</span>
                                <span>-₺{{ formatPrice(appliedCoupon.discount_amount) }}</span>
                            </div>
                        </div>
                        
                        <div class="flex justify-between items-center border-t border-gray-200 pt-4 mb-6">
                            <span class="font-bold text-gray-900 text-lg">Toplam</span>
                            <span class="font-bold text-[#2B7FFF] text-2xl">₺{{ formatPrice(totalAmount) }}</span>
                        </div>
                        
                        <!-- Action Button -->
                        <button v-if="currentStep === 1" @click="goToPayment" class="w-full bg-[#2B7FFF] hover:bg-blue-600 text-white font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                            Ödemeye Geç
                        </button>
                        <button v-if="currentStep === 2 && !paytrToken" @click="submitOrder" :disabled="isSubmitting" class="w-full bg-[#2B7FFF] hover:bg-blue-600 text-white font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                            {{ isSubmitting ? 'İşleniyor...' : 'Siparişi Tamamla' }}
                        </button>

                        <div class="mt-6 space-y-2 text-[11px] text-gray-500">
                            <div class="flex items-center gap-2"><Icon name="shieldCheck" class="w-3.5 h-3.5 text-[#22C55E]" /> Güvenli ödeme garantisi</div>
                            <div class="flex items-center gap-2"><Icon name="arrowPath" class="w-3.5 h-3.5 text-[#22C55E]" /> 14 gün içinde iade</div>
                            <div class="flex items-center gap-2"><Icon name="truck" class="w-3.5 h-3.5 text-[#22C55E]" /> Ücretsiz kargo seçeneği</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #E5E7EB;
    border-radius: 4px;
}
</style>
