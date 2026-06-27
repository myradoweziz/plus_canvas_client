# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Hakkımızda Sayfası Admin Paneli Kodu (HTML)

Aşağıdaki HTML kodunu Admin panelinizdeki "Hakkımızda" (hakkimizda) sayfasını düzenlerken "Source" (Kaynak) moduna geçip yapıştırabilirsiniz:

```html
<div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b; background-color: #ffffff; overflow: hidden;">

  <!-- Hero Section -->
  <div style="padding: 5rem 1rem;">
    <div style="max-width: 64rem; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 4rem;">
      <div style="flex: 1; min-width: 300px;">
        <h1 style="font-size: 3.5rem; font-weight: 800; color: #111827; margin: 0 0 1.5rem 0; line-height: 1.1;">PlusCanvas Nedir</h1>
        <p style="color: #4b5563; font-size: 1.1rem; line-height: 1.7; margin: 0 0 1.5rem 0;">PlusCanvas, fotoğraflarınızı ve tasarımlarınızı premium kalitede kanvas tablolara dönüştüren öncü bir platformdur.</p>
        <p style="color: #4b5563; font-size: 1.1rem; line-height: 1.7; margin: 0 0 1.5rem 0;">Modern teknoloji ve geleneksel sanat anlayışını bir araya getirerek, ev ve ofisleriniz için benzersiz dekorasyon çözümleri sunuyoruz.</p>
        <p style="color: #4b5563; font-size: 1.1rem; line-height: 1.7; margin: 0;">Her bir tablo, özenle seçilmiş malzemeler ve profesyonel baskı teknikleriyle üretilir. Amacımız, duvarlarınızı sanat galerilerine dönüştürmektir.</p>
      </div>
      <div style="flex: 1; min-width: 300px; position: relative;">
        <!-- Card Frame with Image -->
        <div style="background: white; border-radius: 1.5rem; padding: 0.75rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); transform: rotate(3deg); transition: transform 0.3s;">
          <img src="https://images.unsplash.com/photo-1583847268964-b28ce8f30e9c?auto=format&fit=crop&w=800&q=80" alt="PlusCanvas Tablo" style="width: 100%; border-radius: 1rem; display: block;">
        </div>
      </div>
    </div>
  </div>

  <!-- Üretim Sürecimiz Section -->
  <div style="background-color: #f8fafc; padding: 5rem 1rem; position: relative;">
     <!-- Background Curve/Shape -->
     <div style="position: absolute; right: 0; top: 0; width: 50%; height: 100%; background: white; border-bottom-left-radius: 100%; z-index: 0;"></div>
     <div style="max-width: 64rem; margin: 0 auto; display: flex; flex-wrap: wrap-reverse; align-items: center; gap: 4rem; position: relative; z-index: 1;">
        <div style="flex: 1; min-width: 300px; position: relative;">
           <img src="https://images.unsplash.com/photo-1598367776100-345339fcc0be?auto=format&fit=crop&w=800&q=80" alt="Üretim Süreci" style="width: 100%; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
           <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 4rem; height: 4rem; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
              <svg style="width: 2rem; height: 2rem; color: #111827; margin-left: 0.25rem;" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
           </div>
        </div>
        <div style="flex: 1; min-width: 300px;">
           <h2 style="font-size: 2.5rem; font-weight: 800; color: #111827; margin: 0 0 1.5rem 0;">Üretim Sürecimiz</h2>
           <p style="color: #4b5563; font-size: 1.1rem; line-height: 1.7; margin: 0 0 1.5rem 0;">Modern tesisimizde, her tablo profesyonel ekipmanlar ile üretilir. UV baskı teknolojisi sayesinde renkler canlı ve uzun ömürlüdür.</p>
           <p style="color: #4b5563; font-size: 1.1rem; line-height: 1.7; margin: 0 0 1.5rem 0;">Kalite kontrol sürecimiz çok katmanlıdır. Her ürün, size ulaşmadan önce detaylı incelemelerden geçer.</p>
           <p style="color: #4b5563; font-size: 1.1rem; line-height: 1.7; margin: 0;">Çevre dostu üretim yöntemlerimiz ve sürdürülebilir malzemeler kullanarak, hem kaliteyi hem de doğaya saygıyı ön planda tutuyoruz.</p>
        </div>
     </div>
  </div>

  <!-- Product Mockups -->
  <div style="padding: 4rem 1rem; background-color: #f8fafc;">
     <div style="max-width: 64rem; margin: 0 auto; display: flex; justify-content: center; align-items: center; gap: 2rem; flex-wrap: wrap;">
        <img src="/images/product-mockup-1.png" alt="Mockup 1" style="height: 160px; object-fit: contain; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));" onerror="this.style.display='none'">
        <img src="/images/product-mockup-2.png" alt="Mockup 2" style="height: 200px; object-fit: contain; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));" onerror="this.style.display='none'">
        <img src="/images/product-mockup-3.png" alt="Mockup 3" style="height: 140px; object-fit: contain; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));" onerror="this.style.display='none'">
     </div>
  </div>

  <!-- Giant Text & Plus Logo Background -->
  <div style="position: relative; padding: 6rem 1rem; background: white; overflow: hidden;">
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.02; pointer-events: none; z-index: 0; width: 80rem; height: 80rem;">
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" style="width: 100%; height: 100%;">
        <path d="M188.35 32.7694C188.877 32.7694 189.392 32.7121 189.897 32.5976C190.424 32.483 190.802 32.357 191.031 32.2195V28.9197L188.109 29.1603C187.33 29.229 186.711 29.4009 186.253 29.6759C185.818 29.9509 185.6 30.3633 185.6 30.9133C185.6 31.4862 185.818 31.9445 186.253 32.2882C186.688 32.609 187.387 32.7694 188.35 32.7694ZM188.144 18.986C190.504 18.986 192.394 19.4901 193.815 20.4984C195.236 21.4837 195.946 23.019 195.946 25.1043V32.9069C195.946 33.4798 195.797 33.9496 195.499 34.3162C195.201 34.6599 194.835 34.9578 194.399 35.2099C193.712 35.6224 192.853 35.9432 191.821 36.1723C190.813 36.4015 189.656 36.5161 188.35 36.5161C186.012 36.5161 184.145 36.0692 182.747 35.1755C181.372 34.2589 180.685 32.8955 180.685 31.0852C180.685 29.5269 181.166 28.3353 182.128 27.5104C183.091 26.6625 184.523 26.1469 186.425 25.9636L191.031 25.4824V25.0699C191.031 24.2679 190.722 23.695 190.103 23.3513C189.484 23.0076 188.625 22.8357 187.525 22.8357C186.654 22.8357 185.795 22.9388 184.947 23.1451C184.099 23.3513 183.343 23.6034 182.678 23.9013C182.403 23.695 182.174 23.4086 181.991 23.0419C181.808 22.6753 181.716 22.2857 181.716 21.8733C181.716 20.9108 182.231 20.2119 183.263 19.7765C183.927 19.5245 184.695 19.3297 185.566 19.1922C186.459 19.0547 187.319 18.986 188.144 18.986Z" fill="#101828"/>
        <path d="M211.215 31.1883C211.215 32.8611 210.584 34.1787 209.324 35.1412C208.064 36.0807 206.231 36.5504 203.825 36.5504C201.945 36.5504 200.399 36.2755 199.184 35.7255C197.97 35.1526 197.362 34.3391 197.362 33.285C197.362 32.8038 197.466 32.3913 197.672 32.0476C197.878 31.681 198.142 31.3945 198.462 31.1883C199.104 31.5778 199.849 31.9216 200.697 32.2195C201.567 32.5174 202.553 32.6663 203.653 32.6663C205.348 32.6663 206.196 32.1851 206.196 31.2227C206.196 30.8102 206.036 30.4894 205.715 30.2602C205.417 30.0082 204.936 29.8134 204.271 29.6759L202.759 29.3322C200.949 28.9655 199.585 28.3812 198.669 27.5791C197.775 26.7542 197.328 25.6314 197.328 24.2106C197.328 22.6066 197.97 21.3348 199.253 20.3952C200.559 19.4557 202.312 18.986 204.512 18.986C205.612 18.986 206.609 19.1005 207.502 19.3297C208.396 19.5359 209.106 19.8567 209.634 20.2921C210.161 20.7275 210.424 21.2775 210.424 21.942C210.424 22.3774 210.332 22.7784 210.149 23.1451C209.966 23.4888 209.737 23.7638 209.462 23.97C209.187 23.8096 208.797 23.6492 208.293 23.4888C207.789 23.3055 207.227 23.1565 206.609 23.0419C206.013 22.9045 205.451 22.8357 204.924 22.8357C204.099 22.8357 203.446 22.9503 202.965 23.1794C202.507 23.4086 202.278 23.7523 202.278 24.2106C202.278 24.5085 202.404 24.772 202.656 25.0012C202.931 25.2074 203.412 25.3907 204.099 25.5512L205.474 25.8605C207.514 26.3417 208.98 27.0177 209.874 27.8885C210.768 28.7364 211.215 29.8363 211.215 31.1883Z" fill="#101828"/>
        <path d="M191.242 49.187C191.242 48.9044 191.329 48.6676 191.505 48.4766C191.688 48.278 191.929 48.1787 192.227 48.1787C192.532 48.1787 192.773 48.278 192.949 48.4766C193.124 48.6676 193.212 48.9044 193.212 49.187C193.212 49.462 193.124 49.6988 192.949 49.8974C192.773 50.0883 192.532 50.1838 192.227 50.1838C191.929 50.1838 191.688 50.0883 191.505 49.8974C191.329 49.6988 191.242 49.462 191.242 49.187Z" fill="#101828"/>
        <path d="M196.284 45.681C195.864 45.681 195.505 45.8185 195.207 46.0934C194.917 46.3608 194.772 46.7542 194.772 47.2736C194.772 47.7853 194.913 48.1711 195.196 48.4308C195.478 48.6905 195.837 48.8203 196.273 48.8203C196.525 48.8203 196.742 48.7898 196.926 48.7287C197.117 48.6599 197.281 48.5912 197.418 48.5224C197.548 48.6141 197.648 48.7134 197.716 48.8203C197.785 48.9273 197.819 49.061 197.819 49.2214C197.819 49.504 197.667 49.7331 197.361 49.9088C197.056 50.0769 196.632 50.1609 196.089 50.1609C195.486 50.1609 194.955 50.0539 194.497 49.8401C194.038 49.6262 193.683 49.3016 193.431 48.8662C193.187 48.4308 193.064 47.8999 193.064 47.2736C193.064 46.609 193.198 46.0629 193.465 45.6351C193.74 45.1997 194.103 44.8751 194.554 44.6612C195.012 44.4397 195.509 44.329 196.043 44.329C196.57 44.329 196.983 44.4244 197.281 44.6154C197.586 44.8064 197.739 45.0432 197.739 45.3258C197.739 45.4633 197.705 45.5893 197.636 45.7039C197.575 45.8108 197.502 45.9025 197.418 45.9789C197.273 45.9025 197.105 45.8337 196.914 45.7726C196.731 45.7115 196.521 45.681 196.284 45.681Z" fill="#101828"/>
        <path d="M203.59 47.2507C203.59 47.8464 203.472 48.3659 203.235 48.8089C202.998 49.2443 202.662 49.5804 202.227 49.8172C201.791 50.0539 201.279 50.1723 200.691 50.1723C200.103 50.1723 199.591 50.0578 199.156 49.8286C198.721 49.5918 198.384 49.2557 198.148 48.8203C197.911 48.3773 197.793 47.8541 197.793 47.2507C197.793 46.6549 197.911 46.1393 198.148 45.7039C198.392 45.2685 198.732 44.9324 199.167 44.6956C199.61 44.4512 200.118 44.329 200.691 44.329C201.272 44.329 201.78 44.4512 202.215 44.6956C202.651 44.9324 202.987 45.2723 203.223 45.7153C203.468 46.1507 203.59 46.6625 203.59 47.2507ZM200.691 45.6695C200.332 45.6695 200.046 45.807 199.832 46.082C199.626 46.357 199.523 46.7465 199.523 47.2507C199.523 47.7624 199.626 48.1558 199.832 48.4308C200.038 48.7058 200.325 48.8433 200.691 48.8433C201.066 48.8433 201.352 48.7058 201.551 48.4308C201.757 48.1482 201.86 47.7548 201.86 47.2507C201.86 46.7542 201.757 46.3684 201.551 46.0934C201.344 45.8108 201.058 45.6695 200.691 45.6695Z" fill="#101828"/>
        <path d="M208.965 47.5142H207.281V46.4257C207.281 46.1584 207.201 45.9674 207.04 45.8528C206.887 45.7306 206.697 45.6695 206.467 45.6695C206.299 45.6695 206.147 45.6962 206.009 45.7497C205.872 45.7955 205.757 45.8452 205.665 45.8987V47.5142H203.981V45.7268C203.981 45.5358 204.019 45.3792 204.096 45.257C204.18 45.1272 204.302 45.0126 204.462 44.9133C204.707 44.7376 205.012 44.5963 205.379 44.4894C205.746 44.3824 206.127 44.329 206.525 44.329C206.891 44.329 207.235 44.3863 207.556 44.5008C207.877 44.6154 208.155 44.7911 208.392 45.0279C208.453 45.0737 208.511 45.1234 208.564 45.1768C208.618 45.2227 208.66 45.2761 208.69 45.3372C208.766 45.4594 208.831 45.5969 208.885 45.7497C208.938 45.9025 208.965 46.0552 208.965 46.208V47.5142ZM212.265 47.5142H210.569V46.4257C210.569 46.1584 210.497 45.9674 210.351 45.8528C210.206 45.7306 210.015 45.6695 209.779 45.6695C209.603 45.6695 209.435 45.7039 209.274 45.7726C209.114 45.8414 208.98 45.9292 208.873 46.0361L207.98 45.0508C208.232 44.8598 208.518 44.6918 208.839 44.5467C209.16 44.4015 209.553 44.329 210.019 44.329C210.416 44.329 210.783 44.3977 211.119 44.5352C211.463 44.6727 211.738 44.8904 211.944 45.1883C212.158 45.4862 212.265 45.8796 212.265 46.3684V47.5142ZM205.665 46.9871V49.989C205.597 50.0043 205.493 50.0234 205.356 50.0463C205.218 50.0692 205.07 50.0807 204.909 50.0807C204.588 50.0807 204.352 50.0234 204.199 49.9088C204.054 49.7942 203.981 49.588 203.981 49.2901V46.9871H205.665ZM208.965 46.9871V49.989C208.896 50.0043 208.793 50.0234 208.656 50.0463C208.518 50.0692 208.369 50.0807 208.209 50.0807C207.888 50.0807 207.651 50.0234 207.499 49.9088C207.353 49.7942 207.281 49.588 207.281 49.2901V46.9871H208.965ZM212.265 46.9871V49.989C212.188 50.0043 212.082 50.0234 211.944 50.0463C211.807 50.0692 211.661 50.0807 211.509 50.0807C211.18 50.0807 210.94 50.0234 210.787 49.9088C210.642 49.7942 210.569 49.588 210.569 49.2901V46.9871H212.265Z" fill="#101828"/>
      </svg>
    </div>

    <div style="position: relative; z-index: 10; text-align: center; max-width: 64rem; margin: 0 auto;">
      <h2 style="font-size: 5rem; font-weight: 900; line-height: 1.1; margin: 0 0 3rem 0; text-transform: uppercase;">
        HER ZAMAN <br>
        <span style="color: #3b82f6;">BEKLENTİNİN</span> <br>
        ÖTESİNDE
      </h2>

      <div style="width: 3rem; height: 2px; background-color: #3b82f6; margin: 0 auto 3rem auto;"></div>

      <h3 style="font-size: 2rem; font-weight: 800; color: #111827; margin: 0 0 2rem 0;">Neden PlusCanvas Tablolar</h3>
      
      <div style="color: #4b5563; font-size: 1rem; line-height: 1.8; max-width: 48rem; margin: 0 auto 4rem auto;">
        <p style="margin-bottom: 1.5rem;">PlusCanvas, Türkiye'nin en kaliteli kanvas tablo üreticilerinden biridir. Yılların deneyimi ve en son teknoloji ile donatılmış üretim tesisimizde, her bir tablo özenle hazırlanır.</p>
        <p style="margin-bottom: 1.5rem;">Müşteri memnuniyeti bizim için her şeyden önemlidir. Bu nedenle, siparişinizin her aşamasında titizlikle çalışır, size en iyi hizmeti sunmayı amaçlarız.</p>
        <p style="margin-bottom: 1.5rem;">Geniş ürün yelpazemiz sayesinde her zevke ve mekana uygun tablolar bulabilirsiniz. Hazır koleksiyonlarımızdan seçim yapabileceğiniz gibi, kendi fotoğraflarınızı da tabloya dönüştürebilirsiniz.</p>
        <p style="margin-bottom: 0;">Kaliteli malzemeler, profesyonel baskı teknikleri ve hızlı teslimat ile PlusCanvas, duvarlarınızı güzelleştirmenin en kolay yoludur.</p>
      </div>

      <h3 style="font-size: 1.5rem; font-weight: 800; color: #111827; margin: 0 0 2rem 0;">Hayalinizdeki Tabloyu Oluşturun</h3>
      
      <div style="display: flex; justify-content: center; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
        <a href="/products" style="display: inline-flex; align-items: center; justify-content: center; background-color: #3b82f6; color: white; font-weight: 700; font-size: 0.875rem; padding: 1rem 2rem; border-radius: 0.5rem; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);">
          <svg style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          KİŞİYE ÖZEL TABLO
        </a>
        <span style="color: #9ca3af; font-size: 0.875rem;">veya</span>
        <a href="/gallery" style="display: inline-flex; align-items: center; justify-content: center; background-color: white; color: #111827; font-weight: 700; font-size: 0.875rem; padding: 1rem 2rem; border-radius: 0.5rem; text-decoration: none; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
          <svg style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          KANVAS TABLO GALERİSİ
        </a>
      </div>
    </div>
  </div>

  <!-- Features Grid -->
  <div style="padding: 5rem 1rem;">
    <div style="max-width: 64rem; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 4rem;">
        <h2 style="font-size: 2.5rem; font-weight: 800; color: #111827; margin: 0 0 1rem 0;">Tablodan fazlasını sunuyoruz</h2>
        <p style="color: #6b7280; font-size: 1.1rem; margin: 0;">Size en iyi deneyimi sunmak için her aşamada yanınızdayız</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
        <!-- Feature 1 -->
        <div style="background-color: #f8fafc; padding: 2.5rem 1.5rem; border-radius: 1rem; text-align: center;">
          <div style="width: 3.5rem; height: 3.5rem; background-color: #111827; color: #ffffff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
            <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">Özel Tasarım</h4>
          <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin: 0;">Kendi tablonuzu tasarlayın. Özel yazı ve etiket seçenekleriyle anında sipariş verin.</p>
        </div>
        <!-- Feature 2 -->
        <div style="background-color: #f8fafc; padding: 2.5rem 1.5rem; border-radius: 1rem; text-align: center;">
          <div style="width: 3.5rem; height: 3.5rem; background-color: #111827; color: #ffffff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
             <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">Mükemmel işçilik kalitesi</h4>
          <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin: 0;">Birinci sınıf malzeme ve usta işçilik. Askı aparatı dahil, güvenli paketleme ile kapınıza teslim.</p>
        </div>
        <!-- Feature 3 -->
        <div style="background-color: #f8fafc; padding: 2.5rem 1.5rem; border-radius: 1rem; text-align: center;">
          <div style="width: 3.5rem; height: 3.5rem; background-color: #111827; color: #ffffff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
            <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">Kolay Sipariş</h4>
          <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin: 0;">Tablonuzu 3 adımda tasarlayın ve sipariş verin. Karmaşa yok, sadece hız.</p>
        </div>
        <!-- Feature 4 -->
        <div style="background-color: #f8fafc; padding: 2.5rem 1.5rem; border-radius: 1rem; text-align: center;">
          <div style="width: 3.5rem; height: 3.5rem; background-color: #111827; color: #ffffff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
             <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">Müşteri Desteği</h4>
          <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin: 0;">Sorularınıza hızlı yanıt. Telefon veya e-posta ile kesintisiz destek ve kolay takip.</p>
        </div>
        <!-- Feature 5 -->
        <div style="background-color: #f8fafc; padding: 2.5rem 1.5rem; border-radius: 1rem; text-align: center;">
          <div style="width: 3.5rem; height: 3.5rem; background-color: #111827; color: #ffffff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
             <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">Ücretsiz Kargo</h4>
          <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin: 0;">Tüm Türkiye'ye hızlı ve güvenli teslimat. Siparişleriniz sigortalı olarak kapınıza gelsin.</p>
        </div>
        <!-- Feature 6 -->
        <div style="background-color: #f8fafc; padding: 2.5rem 1.5rem; border-radius: 1rem; text-align: center;">
          <div style="width: 3.5rem; height: 3.5rem; background-color: #111827; color: #ffffff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
             <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">Geniş Galeri</h4>
          <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin: 0;">Dünyaca ünlü eserlerden modern sanata kadar her zevke uygun binlerce tablo seçeneği.</p>
        </div>
        <!-- Feature 7 -->
        <div style="background-color: #f8fafc; padding: 2.5rem 1.5rem; border-radius: 1rem; text-align: center;">
          <div style="width: 3.5rem; height: 3.5rem; background-color: #111827; color: #ffffff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
             <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">AI ve Photoshop</h4>
          <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin: 0;">Yapay zeka desteğiyle fotoğraflarınızın kalitesini ve çözünürlüğünü ücretsiz olarak artırıyoruz.</p>
        </div>
        <!-- Feature 8 -->
        <div style="background-color: #f8fafc; padding: 2.5rem 1.5rem; border-radius: 1rem; text-align: center;">
          <div style="width: 3.5rem; height: 3.5rem; background-color: #111827; color: #ffffff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
             <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">Sosyal Medya</h4>
          <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin: 0;">Instagram ve Facebook fotoğraflarınızdan sanatsal tablolar oluşturun, anılarınızı duvarlara taşıyın.</p>
        </div>
        <!-- Feature 9 -->
        <div style="background-color: #f8fafc; padding: 2.5rem 1.5rem; border-radius: 1rem; text-align: center;">
          <div style="width: 3.5rem; height: 3.5rem; background-color: #111827; color: #ffffff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
             <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514"></path></svg>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">Tam Garanti</h4>
          <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin: 0;">Beğenmediğiniz ürünü ücretsiz değiştiriyor veya iade alıyoruz. %100 müşteri memnuniyeti garantisi.</p>
        </div>
        <!-- Feature 10 -->
        <div style="background-color: #f8fafc; padding: 2.5rem 1.5rem; border-radius: 1rem; text-align: center;">
          <div style="width: 3.5rem; height: 3.5rem; background-color: #111827; color: #ffffff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
             <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">Taksitli Ödeme</h4>
          <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin: 0;">Kredi kartı veya havale ile güvenli ödeme. Kartınıza taksit imkanlarıyla kolayca satın alın.</p>
        </div>
      </div>
    </div>
  </div>

</div>
```
