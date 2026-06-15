<script setup lang="ts">
	type FeatureCallout = {
		text: string
		/** Точка на изображении (0–100% от ширины/высоты картинки) */
		x: number
		y: number
		/** Подпись относительно контейнера (%) */
		labelX: number
		labelY: number
		number?: number
	}

	type FeatureCard = {
		image: string
		title: string
		callouts: FeatureCallout[]
		swatches?: string[]
	}

	/** product3 = çerçeveli, product2 = kanvas, product1 = paketleme */
	const featureCards: FeatureCard[] = [
		{
			image: '/images/product_features/product3.png',
			title: 'Çerçeveli tablo özellikleri',
			swatches: ['#1a1a1a', '#f3f4f6', '#c9a66b', '#6b4f2a'],
			callouts: [
				{ text: '3cm kalınlıkta çerçeve', x: 71, y: 34, labelX: 2, labelY: 10 },
				{ text: 'Çerçeve ve kanvas arasında boşluk', x: 36, y: 54, labelX: 2, labelY: 42 },
				{ text: 'Çerçeve renk seçenekleri', x: 52, y: 73, labelX: 2, labelY: 68 }
			]
		},
		{
			image: '/images/product_features/product2.png',
			title: 'Kanvas tablo özellikleri',
			callouts: [
				// металлический askı на задней стороне
				{ text: 'Askı ve çiviler', x: 46, y: 10, labelX: 2, labelY: 5 },
				// боковая кромка заднего полотна (толщина ~3 cm)
				{ text: '3cm kenar kalınlığı', x: 15, y: 40, labelX: 2, labelY: 19 },
				// лицевая поверхность tuval
				{ text: '%100 pamuk dokulu kanvas (tuval)', x: 52, y: 18, labelX: 2, labelY: 33 },
				// зона печати на лицевой стороне
				{ text: 'HP baskı', x: 57, y: 63, labelX: 2, labelY: 47 },
				// деревянный şase на обороте
				{ text: 'Ahşap şase', x: 17, y: 58, labelX: 2, labelY: 61 },
				// нижний gallery-wrap (kenar baskısı)
				{ text: 'Kenar baskısı', x: 56, y: 81, labelX: 2, labelY: 75 }
			]
		},
		{
			image: '/images/product_features/product1.png',
			title: 'Paketleme özellikleri',
			callouts: [
				// верхний левый клапан коробки (güçlendirilmiş mukavva)
				{ text: 'Güçlendirilmiş mukavva', x: 20, y: 20, labelX: 2, labelY: 12, number: 1 },
				// угловой протектор на холсте (ближний левый угол)
				{ text: 'Köşe korumaları', x: 33, y: 57, labelX: 2, labelY: 42, number: 2 },
				// нижняя горизонтальная амортизирующая кромка внутри коробки
				{ text: 'Darbe emici kenarlıklar', x: 52, y: 70, labelX: 2, labelY: 66, number: 3 }
			]
		}
	]

	type LayoutPoint = { left: number; top: number }
	type CardLayout = {
		width: number
		height: number
		dots: LayoutPoint[]
		lines: string[]
	}

	const diagramRefs = ref<(HTMLElement | null)[]>([])
	const cardLayouts = ref<CardLayout[]>([])

	const getContainRect = (img: HTMLImageElement, box: DOMRect) => {
		const iw = img.naturalWidth
		const ih = img.naturalHeight
		if (!iw || !ih) return null

		const scale = Math.min(box.width / iw, box.height / ih)
		const width = iw * scale
		const height = ih * scale
		return {
			left: (box.width - width) / 2,
			top: (box.height - height) / 2,
			width,
			height
		}
	}

	const labelAnchor = (callout: FeatureCallout, boxW: number, boxH: number) => {
		const x = (callout.labelX / 100) * boxW
		const y = (callout.labelY / 100) * boxH + 9
		const textW = Math.min(callout.text.length * 5.2, boxW * 0.42)
		if (callout.labelX >= 45) return { x: x + 6, y }
		return { x: x + textW, y }
	}

	const buildCardLayout = (cardIndex: number) => {
		const el = diagramRefs.value[cardIndex]
		const img = el?.querySelector<HTMLImageElement>('.product-features__diagram-img')
		if (!el || !img?.naturalWidth) return

		const box = el.getBoundingClientRect()
		const imageRect = getContainRect(img, box)
		if (!imageRect) return

		const card = featureCards[cardIndex]
		const dots = card.callouts.map((callout) => ({
			left: imageRect.left + (callout.x / 100) * imageRect.width,
			top: imageRect.top + (callout.y / 100) * imageRect.height
		}))

		const lines = card.callouts.map((callout, i) => {
			const anchor = labelAnchor(callout, box.width, box.height)
			const dot = dots[i]
			const midX = anchor.x + (dot.left - anchor.x) * 0.55
			return `M ${anchor.x} ${anchor.y} L ${midX} ${anchor.y} L ${dot.left} ${dot.top}`
		})

		const next = [...cardLayouts.value]
		next[cardIndex] = { width: box.width, height: box.height, dots, lines }
		cardLayouts.value = next
	}

	const rebuildLayouts = () => {
		featureCards.forEach((_, index) => buildCardLayout(index))
	}

	const setDiagramRef = (el: HTMLElement | null, index: number) => {
		diagramRefs.value[index] = el
	}

	const onDiagramImageLoad = (index: number) => {
		buildCardLayout(index)
	}

	onMounted(() => {
		if (!import.meta.client) return
		rebuildLayouts()
		const ro = new ResizeObserver(() => rebuildLayouts())
		diagramRefs.value.forEach((el) => {
			if (el) ro.observe(el)
		})
		onUnmounted(() => ro.disconnect())
	})
</script>

<template>
	<section class="product-features pt-10 sm:pt-14 md:pt-20">
		<h2 class="text-center text-xl sm:text-2xl md:text-[28px] font-bold text-[#101828] mb-6 sm:mb-8 md:mb-10">
			Ürün Özellikleri
		</h2>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
			<article
				v-for="(card, index) in featureCards"
				:key="card.title"
				class="product-features__card group"
				tabindex="0"
			>
				<div class="product-features__frame">
					<img :src="card.image" :alt="card.title" class="product-features__img" loading="lazy" />

					<div class="product-features__overlay" aria-hidden="true">
						<h3 class="product-features__overlay-title">{{ card.title }}</h3>

						<div :ref="(el) => setDiagramRef(el as HTMLElement | null, index)" class="product-features__diagram">
							<img
								:src="card.image"
								alt=""
								class="product-features__diagram-img"
								loading="lazy"
								@load="onDiagramImageLoad(index)"
							/>

							<svg
								v-if="cardLayouts[index]"
								class="product-features__lines"
								:viewBox="`0 0 ${cardLayouts[index].width} ${cardLayouts[index].height}`"
								aria-hidden="true"
							>
								<path
									v-for="(path, lineIndex) in cardLayouts[index].lines"
									:key="lineIndex"
									:d="path"
									class="product-features__line"
								/>
							</svg>

							<div
								v-for="(callout, calloutIndex) in card.callouts"
								:key="`label-${calloutIndex}`"
								class="product-features__label"
								:style="{ left: `${callout.labelX}%`, top: `${callout.labelY}%` }"
							>
								<span class="product-features__label-text">{{ callout.text }}</span>
							</div>

							<div
								v-for="(callout, calloutIndex) in card.callouts"
								:key="`dot-${calloutIndex}`"
								class="product-features__dot"
								:class="{ 'product-features__dot--numbered': callout.number != null }"
								:style="
									cardLayouts[index]?.dots[calloutIndex]
										? {
												left: `${cardLayouts[index].dots[calloutIndex].left}px`,
												top: `${cardLayouts[index].dots[calloutIndex].top}px`
											}
										: undefined
								"
							>
								<span v-if="callout.number != null">{{ callout.number }}</span>
							</div>

							<div v-if="card.swatches?.length && index === 0" class="product-features__swatches">
								<span
									v-for="(color, swatchIndex) in card.swatches"
									:key="swatchIndex"
									class="product-features__swatch"
									:style="{ backgroundColor: color }"
								/>
							</div>
						</div>
					</div>
				</div>
			</article>
		</div>
	</section>
</template>

<style lang="scss" scoped>
	.product-features__card {
		min-height: 220px;
	}

	.product-features__frame {
		position: relative;
		height: 100%;
		min-height: 220px;
		border-radius: 16px;
		background: #fff;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
		transition: box-shadow 0.3s ease;
	}

	.product-features__img {
		display: block;
		width: 100%;
		height: 100%;
		min-height: 220px;
		object-fit: contain;
		object-position: center;
		padding: 12px;
		box-sizing: border-box;
	}

	.product-features__overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		padding: 12px 10px 10px;
		background: #fff;
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 0.3s ease,
			visibility 0.3s ease;
		pointer-events: none;
	}

	.product-features__diagram {
		position: relative;
		flex: 1;
		min-height: 0;
	}

	.product-features__diagram-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center;
		pointer-events: none;
	}

	.product-features__overlay-title {
		flex-shrink: 0;
		margin: 0 0 6px;
		text-align: center;
		font-size: 13px;
		font-weight: 700;
		line-height: 1.3;
		color: #101828;
	}

	.product-features__lines {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		z-index: 1;
		pointer-events: none;
	}

	.product-features__line {
		fill: none;
		stroke: #101828;
		stroke-width: 1;
		opacity: 0.9;
	}

	.product-features__dot {
		position: absolute;
		width: 9px;
		height: 9px;
		margin: -4.5px 0 0 -4.5px;
		border-radius: 9999px;
		background: #2563eb;
		border: 1.5px solid #fff;
		box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.4);
		z-index: 3;
	}

	.product-features__dot--numbered {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		margin: -8px 0 0 -8px;
		color: #fff;
		font-size: 9px;
		font-weight: 700;
		line-height: 1;
	}

	.product-features__label {
		position: absolute;
		max-width: 46%;
		z-index: 2;
	}

	.product-features__label-text {
		display: block;
		font-size: 9px;
		line-height: 1.2;
		font-weight: 600;
		color: #101828;
	}

	.product-features__swatches {
		position: absolute;
		left: 2%;
		bottom: 5%;
		display: flex;
		gap: 5px;
		z-index: 2;
	}

	.product-features__swatch {
		width: 20px;
		height: 20px;
		border-radius: 3px;
		border: 1px solid rgba(16, 24, 40, 0.15);
		box-shadow: 0 1px 2px rgba(16, 24, 40, 0.08);
	}

	@media (hover: hover) {
		.product-features__card:hover .product-features__frame,
		.product-features__card:focus-within .product-features__frame {
			box-shadow: 0 8px 24px rgba(16, 24, 40, 0.1);
		}

		.product-features__card:hover .product-features__overlay,
		.product-features__card:focus-within .product-features__overlay {
			opacity: 1;
			visibility: visible;
		}
	}

	@media (min-width: 768px) {
		.product-features__card {
			min-height: 280px;
		}

		.product-features__frame {
			min-height: 280px;
		}

		.product-features__img {
			min-height: 280px;
			padding: 16px;
		}

		.product-features__overlay-title {
			font-size: 14px;
			margin-bottom: 8px;
		}

		.product-features__label-text {
			font-size: 10px;
		}

		.product-features__dot {
			width: 10px;
			height: 10px;
			margin: -5px 0 0 -5px;
		}

		.product-features__dot--numbered {
			width: 18px;
			height: 18px;
			margin: -9px 0 0 -9px;
			font-size: 10px;
		}
	}
</style>
