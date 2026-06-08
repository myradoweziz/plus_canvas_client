export type CanvasProductPriceQuote = {
	base_price: number
	discount: number
	discount_price: number
	size_price: number
	frame_price: number
	old_price: number
	total_price: number
	currency: string
}

export type CanvasProductCalculatePriceBody = {
	canvas_format_id: number
	canvas_size_id: number
	canvas_frame_id: number | null
}
