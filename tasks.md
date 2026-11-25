# MSKLabsWeb — Görev Listesi (Tasks)

> **AI Kod Ajanı Talimatı:** Her görevde yalnızca ilgili dosyalara cerrahi müdahale yapın, mevcut çalışan yapıları bozmayın ve doğrulamadan `[x]` işaretlemeyin. Zorunlu çoklu dil: **TR / EN / AR (RTL)** korunmalıdır.

---

## WEB-DIST-001 — Uygulama İndirme Altyapısının R2/CDN ve Merkezi Katalog Sistemine Taşınması [x]
- **Amaç:** Web sitesindeki yavaş doğrudan GitHub `raw/` ve `releases/download/` linklerini kaldırıp, tüm indirmeleri merkezi `app_catalog.json` ve `msklabsdesk-backend` (`/dl/...` → R2 `302 Redirect` / Eski Sürüm Worker Cache Proxy) altyapısına bağlamak.
- **Sebep:** `24.11.2026` ölçümünde GitHub CDN hızı `~196 KB/s` seviyesinde kalmakta; ayrıca `apps/*.html` ve `download.html` içine gömülü sabit GitHub linkleri sürüm yönetimini ve D1 indirme sayımını engellemektedir.
- **Tasarlanan Değişiklik:** Web vitrinindeki `"GitHub (APK)"` kartı **"Doğrudan İndir (Hızlı CDN)"** olur; tüm indirme butonları `MSKLabsApps/app_catalog.json` (`update_manifest.json` ile uyumlu) üzerinden `msklabsdesk-backend.msklabs-org.workers.dev/dl/<app-slug>/<version>` adresine yönlendirilir.
- **Beklenen Sonuç:** Ziyaretçiler aktif sürümleri Cloudflare R2 hızıyla, eski sürümleri Worker Cache Proxy hızıyla indirir; her indirme `MSKLabsDesk` D1 paneline anlık işlenir ve yeni sürümlerde HTML dosyalarına dokunulmaz.
- **Geçiş Sırası Önkoşulu (`IST-016` Bölüm 6.D):** Bu görev yalnızca **R2 yüklemesi → `MSKLabsDesk` (`DIST-CDN-001`) → `MSKLabsApps` (`app_catalog.json`)** adımları canlıda doğrulandıktan sonra uygulanır (aksi halde canlı sitede 404 oluşur).
- **Referans Kararlar:**
  - `D:\Code\istisare\istisareler\016-melez-hizli-dagitim-r2-ve-worker-cache-mimarisi.md` (`IST-016`)
  - `D:\Code\istisare\istisareler\013-ekosistem-telemetri-cihaz-kimligi-ve-istatistik-mimarisi.md` (`IST-013`)
- **Mimari Kurallar:**
  1. **Sıfır Sabit GitHub Linki:** `apps/*.html` ve `download.html` içinde elle yazılmış `github.com/.../raw/` veya `releases/download/` indirme bağlantısı bırakılmaz.
  2. **Vitrin Etiketi:** Ziyaretçiye gösterilen `"GitHub (APK)"` başlığı yerine kurumsal **"Doğrudan İndir (Hızlı CDN)"** (`TR/EN/AR` uyumlu) kullanılır.
  3. **Tek Kaynak Katalog:** Tüm indirme URL'leri `SITE_CONFIG.fetchCatalog()` (`app_catalog.json`) ve `apps-data.js` fallback'i üzerinden çözülür.

### 📋 Takip Edilebilir Görev Listesi

- [ ] **Task 1 — `app.html` İndirme Kartı ve Etiket Güncellemesi:**
  - [ ] 1.1: `app.html` (satır ~1030–1055) içindeki `"GitHub (APK)"` kart başlığı ve ikonunun `TR / EN / AR` uyumlu **"Doğrudan İndir (Hızlı CDN)"** yapısına dönüştürülmesi.
  - [ ] 1.2: `app_catalog.json` içindeki `cdn_url` / `download_url` alanının öncelikli okunması; varsa eski sürüm listesinin (`versions[]`) de gösterilmesi.
- [ ] **Task 2 — Statik HTML Sayfalarındaki Sabit GitHub Linklerinin Tasfiyesi:**
  - [ ] 2.1: `apps/date_counter.html` (satır ~520) içindeki sabit `D_DateCounter/releases/download/...` bağlantısının merkezi katalog/CDN yapısına bağlanması.
  - [ ] 2.2: `apps/rekatsay.html` (satır ~432, ~452) içindeki sabit `M_RekatSay/raw/main/RekatSay*.apk` bağlantılarının merkezi katalog/CDN yapısına bağlanması.
  - [ ] 2.3: `apps/haydinamaza.html` (satır ~490) içindeki sabit `MSKLabsApps/raw/main/releases/HaydiNamaza.apk` bağlantısının merkezi katalog/CDN yapısına bağlanması.
  - [ ] 2.4: `download.html` (satır ~196–197) içindeki sabit `DateCounter.exe` fallback bağlantılarının güncellenmesi.
- [ ] **Task 3 — Merkezi Worker `/dl/` Yönlendirmesi & `config.js` Uyumu:**
  - [ ] 3.1: `assets/js/config.js` ve `assets/js/apps-data.js` içinde varsayılan indirme URL şablonunun `https://msklabsdesk-backend.msklabs-org.workers.dev/dl/<app-slug>/<version>` ile uyumlu hale getirilmesi (R2 aktif + eski sürüm Cache Proxy).
  - [ ] 3.2: İndirme butonuna tıklandığında hem hızın R2/CDN üzerinden aktığının hem de `MSKLabsDesk` D1 `download_stats` sayacının tetiklendiğinin doğrulanması.
- [ ] **Task 4 — Çoklu Dil (`TR / EN / AR` + RTL) ve Yerel Tarayıcı Doğrulaması:**
  - [ ] 4.1: `app.html`, `download.html` ve `apps/*.html` sayfalarının yerel önizlemede 3 dilde hatasız açılıp indirme linklerinin doğru çözüldüğünün doğrulanması.
  - [ ] 4.2: **Google Play / App Store & Sessiz Telemetri Hatırlatması (`IST-013`):** `privacy.html` (TR/EN/AR) içine *"Uygulama kalitesi ve sürüm takibi için kişisel bilgi içermeyen anonim teknik/sürüm verileri işlenir"* cümlesinin eklendiğinin doğrulanması (uygulama içlerinde opt-out/pop-up konulmadığı için mağaza Data Safety uyumu sağlar).

---
### İndirme Bağlantıları & Favicon Güncellemesi (25.11.2026 - 14:55)
- [x] **İndirme & Mağaza Kanalları:** Google Play ve Microsoft Store pasife alındı; `app.html`, `download.html`, `apps-data.js` ve statik uygulama sayfalarındaki kırık (404) linkler temizlenerek çalışan Hızlı CDN ve Google Drive linklerine bağlandı.
- [x] **Favicon Standardizasyonu:** Yeni `img/MSKLabsFavicon.png` (ve orijinal `img/MSKLabsBroIco.svg` yedeği) eklenerek 40 kamu HTML sayfasına uygulandı; `app.html` ve alt sayfalardaki eksik ikon sorunu giderildi.
