import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
    const isCartOpen = ref(false)
    const cartItems = ref<any[]>([])
    const sessionId = ref<string | null>(null)
    const subtotal = ref(0)
    const shipping = ref(0)
    const total = ref(0)
    const couponDiscount = ref(0)
    const appliedCoupon = ref(null)

    // Load session_id from localStorage on init
    if (import.meta.client) {
        sessionId.value = localStorage.getItem('cart_session_id')
    }

    const openCart = () => {
        isCartOpen.value = true
        fetchCart()
    }

    const closeCart = () => {
        isCartOpen.value = false
    }

    const toggleCart = () => {
        if (isCartOpen.value) {
            closeCart()
        } else {
            openCart()
        }
    }

    const PREVIEW_STORAGE_KEY = 'pluscanvas:cart-item-previews'

    const loadStoredPreviews = (): Record<number, string> => {
        if (!import.meta.client) return {}
        try {
            const raw = localStorage.getItem(PREVIEW_STORAGE_KEY)
            if (!raw) return {}
            const parsed = JSON.parse(raw) as Record<string, string>
            const next: Record<number, string> = {}
            for (const [id, src] of Object.entries(parsed)) {
                const numId = Number(id)
                if (Number.isFinite(numId) && String(src).trim()) next[numId] = String(src).trim()
            }
            return next
        } catch {
            return {}
        }
    }

    const saveStoredPreviews = () => {
        if (!import.meta.client) return
        localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(itemPreviewById.value))
    }

    const itemPreviewById = ref<Record<number, string>>(loadStoredPreviews())

    const pruneItemPreviews = (items: { id: number }[]) => {
        const ids = new Set(items.map((item) => item.id))
        const next: Record<number, string> = {}
        for (const [id, src] of Object.entries(itemPreviewById.value)) {
            if (ids.has(Number(id)) && src.trim()) next[Number(id)] = src
        }
        itemPreviewById.value = next
        saveStoredPreviews()
    }

    const getItemPreview = (itemId: number) => itemPreviewById.value[itemId] ?? ''

    const setItemPreview = (itemId: number, src: string) => {
        const trimmed = String(src ?? '').trim()
        if (!itemId || !trimmed) return
        itemPreviewById.value = { ...itemPreviewById.value, [itemId]: trimmed }
        saveStoredPreviews()
    }

    const attachPreviewToLatestItem = (productId: number, previewSrc: string) => {
        const trimmed = String(previewSrc ?? '').trim()
        if (!trimmed) return
        const match = [...cartItems.value].reverse().find((item) => item.canvas_product_id === productId)
        if (match) setItemPreview(match.id, trimmed)
    }

    const fetchCart = async () => {
        try {
            const { $customFetch } = useNuxtApp()
            const headers: any = {}
            if (sessionId.value) {
                headers['X-Session-ID'] = sessionId.value
            }
            
            const response: any = await $customFetch('/api/carts', {
                headers
            })

            if (response && response.session_id) {
                sessionId.value = response.session_id
                if (import.meta.client) {
                    localStorage.setItem('cart_session_id', response.session_id)
                }
            }

            if (response && response.cart) {
                cartItems.value = response.cart.items || []
                pruneItemPreviews(cartItems.value)
                subtotal.value = response.cart.subtotal || 0
                total.value = response.cart.total || 0
                shipping.value = response.cart.shipping || 0
                if (cartItems.value.length === 0 && appliedCoupon.value) {
                    removeCoupon()
                }
                fetchRecommendedProducts()
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error)
        }
    }

    const addToCart = async (productId: number, quantity = 1, options: Record<string, unknown> = {}) => {
        try {
            const { $customFetch, $toast } = useNuxtApp()
            const headers: any = {}
            if (sessionId.value) {
                headers['X-Session-ID'] = sessionId.value
            }

            let previewUrl = String(options.preview_url ?? '').trim()
            const previewSrc = String(options.preview_src ?? '').trim()
            const apiOptions = { ...options }

            // If we have a base64 preview, upload it to the backend to get a permanent URL
            if (!previewUrl && previewSrc && previewSrc.startsWith('data:image/')) {
                try {
                    const res = await fetch(previewSrc)
                    const blob = await res.blob()
                    const file = new File([blob], 'cart_preview.png', { type: 'image/png' })
                    const formData = new FormData()
                    formData.append('file', file)

                    const uploadRes: any = await $customFetch('/api/media/upload-temp', {
                        method: 'POST',
                        body: formData
                    })

                    if (uploadRes && uploadRes.url) {
                        previewUrl = uploadRes.url
                    }
                } catch (e) {
                    console.error('Failed to upload preview image:', e)
                }
            }

            if (previewUrl) {
                apiOptions.preview_url = previewUrl
            }
            delete apiOptions.preview_src

            const response: any = await $customFetch('/api/carts', {
                method: 'POST',
                headers,
                body: {
                    canvas_product_id: productId,
                    quantity,
                    options: apiOptions
                }
            })

            if (response && response.session_id) {
                sessionId.value = response.session_id
                if (import.meta.client) {
                    localStorage.setItem('cart_session_id', response.session_id)
                }
            }

            if (response && response.cart) {
                cartItems.value = response.cart.items || []
                pruneItemPreviews(cartItems.value)
                if (previewSrc) attachPreviewToLatestItem(productId, previewSrc)
                subtotal.value = response.cart.subtotal || 0
                total.value = response.cart.total || 0
                shipping.value = response.cart.shipping || 0
                
                fetchRecommendedProducts()
                // Show the cart
                openCart()
                $toast.success('Ürün başarıyla sepetinize eklendi.')
            }
        } catch (error) {
            const { $toast } = useNuxtApp()
            console.error('Failed to add to cart:', error)
            $toast.error('Ürün sepete eklenirken bir hata oluştu.')
        }
    }

    const updateQuantity = async (itemId: number, quantity: number) => {
        if (quantity < 1) return
        
        try {
            const { $customFetch } = useNuxtApp()
            const headers: any = {}
            if (sessionId.value) {
                headers['X-Session-ID'] = sessionId.value
            }

            const response: any = await $customFetch(`/api/carts/${itemId}`, {
                method: 'PUT',
                headers,
                body: { quantity }
            })

            if (response && response.cart) {
                cartItems.value = response.cart.items || []
                pruneItemPreviews(cartItems.value)
                subtotal.value = response.cart.subtotal || 0
                total.value = response.cart.total || 0
                shipping.value = response.cart.shipping || 0
            }
        } catch (error) {
            console.error('Failed to update quantity:', error)
        }
    }

    const removeFromCart = async (itemId: number) => {
        try {
            const { $customFetch } = useNuxtApp()
            const headers: any = {}
            if (sessionId.value) {
                headers['X-Session-ID'] = sessionId.value
            }

            await $customFetch(`/api/carts/${itemId}`, {
                method: 'DELETE',
                headers
            })

            // Filter item locally immediately for better UX
            cartItems.value = cartItems.value.filter(item => item.id !== itemId)
            const nextPreviews = { ...itemPreviewById.value }
            delete nextPreviews[itemId]
            itemPreviewById.value = nextPreviews
            saveStoredPreviews()
            if (cartItems.value.length === 0 && appliedCoupon.value) {
                removeCoupon()
            }
            
            // Refetch to get updated totals and recommended
            fetchCart()
        } catch (error) {
            console.error('Failed to remove item:', error)
        }
    }

    // Free shipping calculation
    const freeShippingThreshold = 500 // Can be fetched from settings API
    const remainingForFreeShipping = computed(() => {
        const remaining = freeShippingThreshold - subtotal.value
        return remaining > 0 ? remaining : 0
    })
    
    const freeShippingProgress = computed(() => {
        if (subtotal.value >= freeShippingThreshold) return 100
        return (subtotal.value / freeShippingThreshold) * 100
    })

    const recommendedProducts = ref<any[]>([])

    const fetchRecommendedProducts = async () => {
        if (cartItems.value.length === 0) {
            recommendedProducts.value = []
            return
        }

        const lastItem = cartItems.value[cartItems.value.length - 1]
        const categoryId = lastItem?.canvas_product?.category_id

        if (!categoryId) return

        try {
            const { $customFetch } = useNuxtApp()
            const response: any = await $customFetch(`/api/canvas-products?category_id=${categoryId}&limit=2`)
            if (response && response.data) {
                // Filter out the items already in the cart just in case
                const inCartIds = cartItems.value.map(item => item.canvas_product_id)
                recommendedProducts.value = response.data.filter((p: any) => !inCartIds.includes(p.id)).slice(0, 2)
            }
        } catch (error) {
            console.error('Failed to fetch recommended products', error)
        }
    }

    const finalTotal = computed(() => {
        let ft = total.value - couponDiscount.value
        if (ft < 0) ft = 0
        return ft
    })

    const isApplyingCoupon = ref(false)

    const applyCoupon = async (code: string) => {
        if (!code || !code.trim()) return
        isApplyingCoupon.value = true
        try {
            const { $customFetch, $toast } = useNuxtApp()
            const headers: any = {}
            if (sessionId.value) {
                headers['X-Session-ID'] = sessionId.value
            }
            const response: any = await $customFetch('/api/orders/apply-coupon', {
                method: 'POST',
                headers,
                body: {
                    coupon_code: code.trim(),
                    subtotal: subtotal.value
                }
            })
            if (response && response.success) {
                couponDiscount.value = response.discount_amount || 0
                appliedCoupon.value = code.trim()
                $toast.success('Kupon başarıyla uygulandı.')
            }
        } catch (error: any) {
            const { $toast } = useNuxtApp()
            $toast.error(error.response?._data?.message || 'Geçersiz kupon kodu.')
            couponDiscount.value = 0
            appliedCoupon.value = null
        } finally {
            isApplyingCoupon.value = false
        }
    }

    const removeCoupon = () => {
        couponDiscount.value = 0
        appliedCoupon.value = null
    }

    return {
        isCartOpen,
        cartItems,
        sessionId,
        subtotal,
        shipping,
        total,
        finalTotal,
        couponDiscount,
        appliedCoupon,
        isApplyingCoupon,
        applyCoupon,
        removeCoupon,
        openCart,
        closeCart,
        toggleCart,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        remainingForFreeShipping,
        freeShippingProgress,
        freeShippingThreshold,
        recommendedProducts,
        fetchRecommendedProducts,
        getItemPreview,
        setItemPreview
    }
})
