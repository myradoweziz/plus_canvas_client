import * as vt from 'vue-toastification'
import 'vue-toastification/dist/index.css'

export default defineNuxtPlugin((nuxtApp) => {
	const options = {
		position: 'top-right',
		timeout: 2000,
		closeOnClick: true,
		pauseOnFocusLoss: false,
		pauseOnHover: true
	}
	nuxtApp.vueApp.use(vt.default, options)
	return {
		provide: {
			toast: vt.createToastInterface()
		}
	}
})
