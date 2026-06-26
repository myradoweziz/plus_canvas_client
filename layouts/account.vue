<template>
	<div class="bg-[#F5F2ED] flex-1 flex flex-col w-full h-full">
		<section class="flex-1">
			<header class="bg-white border-b border-gray-100">
				<div class="max-w-[1400px] mx-auto px-4 md:px-10 py-10 md:py-8">
					<h1 class="text-3xl md:text-4xl font-bold text-[#101828] mb-2">Hesabım</h1>
					<p class="text-[#4A5565]">Siparişlerinizi ve hesap bilgilerinizi yönetin</p>
				</div>
			</header>

			<div class="max-w-[1400px] mx-auto px-4 md:px-10 py-10 md:py-8 flex flex-col lg:flex-row gap-8 lg:gap-10">
				<profile-sidebar class="shrink-0" />
				<div class="flex-1 min-w-0">
					<slot />
				</div>
			</div>
		</section>
	</div>
</template>

<style scoped></style>
