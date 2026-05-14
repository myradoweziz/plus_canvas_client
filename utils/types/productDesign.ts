/** Fabric `toJSON` çıktısı + meta (sepet / sipariş için). */
export type ProductDesignPayload = {
	fabric: Record<string, unknown>
	tempImage?: { url: string; id: number; session_id: string } | null
	canvasWidth: number
	canvasHeight: number
}
