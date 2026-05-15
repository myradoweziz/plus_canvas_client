export type TempDesignImage = {
	url: string
	id: number
	session_id: string
}

/** Fabric `toJSON` çıktısı + meta (sepet / sipariş için). */
export type ProductDesignPayload = {
	fabric: Record<string, unknown>
	tempImage?: { url: string; id: number; session_id: string } | null
	canvasWidth: number
	canvasHeight: number
	/** Seçilen baskı boyutu (40×30 cm vb.) */
	printSizeLabel?: string
	formatId?: number
	formatLabel?: string
	printSizeId?: number
	printPrice?: number
	frameId?: string
}
