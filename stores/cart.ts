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
                subtotal.value = response.cart.subtotal || 0
                total.value = response.cart.total || 0
                shipping.value = response.cart.shipping || 0
                fetchRecommendedProducts()
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error)
        }
    }

    const addToCart = async (productId: number, quantity = 1, options = {}) => {
        try {
            const { $customFetch, $toast } = useNuxtApp()
            const headers: any = {}
            if (sessionId.value) {
                headers['X-Session-ID'] = sessionId.value
            }

            const response: any = await $customFetch('/api/carts', {
                method: 'POST',
                headers,
                body: {
                    canvas_product_id: productId,
                    quantity,
                    options
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

    return {
        isCartOpen,
        cartItems,
        sessionId,
        subtotal,
        shipping,
        total,
        couponDiscount,
        appliedCoupon,
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
        fetchRecommendedProducts
    }
})
