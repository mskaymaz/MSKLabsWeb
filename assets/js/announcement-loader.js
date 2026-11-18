/**
 * MSK Labs - Dynamic Announcements & Multi-Language Engine (v2.1)
 * Modularized Runtime: Ticker, Flyout Banner & Multi-Lang Sync/Rotate
 */
(function () {
  'use strict';

  var BANNER_THEMES = {
    info: { bgDark: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,58,138,0.95) 100%)', bgLight: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', textDark: '#bfdbfe', textLight: '#1e40af', borderDark: '1px solid rgba(59, 130, 246, 0.4)', borderLight: '1px solid #bfdbfe', accent: '#2563eb' },
    success: { bgDark: 'linear-gradient(135deg, rgba(2,44,34,0.95) 0%, rgba(6,95,70,0.95) 100%)', bgLight: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', textDark: '#a7f3d0', textLight: '#166534', borderDark: '1px solid rgba(16, 185, 129, 0.4)', borderLight: '1px solid #bbf7d0', accent: '#16a34a' },
    warning: { bgDark: 'linear-gradient(135deg, rgba(69,26,3,0.95) 0%, rgba(120,53,15,0.95) 100%)', bgLight: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', textDark: '#fef08a', textLight: '#92400e', borderDark: '1px solid rgba(245, 158, 11, 0.4)', borderLight: '1px solid #fde68a', accent: '#d97706' },
    purple: { bgDark: 'linear-gradient(135deg, rgba(46,16,101,0.95) 0%, rgba(88,28,135,0.95) 100%)', bgLight: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)', textDark: '#e9d5ff', textLight: '#6b21a8', borderDark: '1px solid rgba(168, 85, 247, 0.4)', borderLight: '1px solid #e9d5ff', accent: '#9333ea' },
    custom: { bgDark: '#1e293b', bgLight: '#f8fafc', textDark: '#f8fafc', textLight: '#0f172a', borderDark: '1px solid #475569', borderLight: '1px solid #cbd5e1', accent: '#3b82f6' },
  };

  function getLang() {
    return document.documentElement.getAttribute('lang') || localStorage.getItem('user_lang') || 'tr';
  }

  function injectStyles() {
    if (document.getElementById('msk-announcement-styles')) return;
    var link = document.createElement('link');
    link.id = 'msk-announcement-styles';
    link.rel = 'stylesheet';
    link.href = '/assets/css/announcements.css?v=20261118_01';
    (document.head || document.documentElement).appendChild(link);
  }

  function getItemContent(item, targetLang) {
    var c = (targetLang === 'ar' ? item.content_ar : targetLang === 'en' ? item.content_en : item.content_tr);
    return (c && c.trim()) ? c : (item.content_tr || '');
  }

  function formatTickerHtml(content) {
    return content.replace(/<\/p>\s*<p[^>]*>/gi, '<span style="display:inline-block; margin:0 35px; opacity:0.6;">•</span>').trim();
  }

  function renderAnnouncementBanner(item, meta, allActiveItems) {
    var isMob = window.innerWidth <= 768;
    var placement = (isMob && item.mobilePlacement) ? item.mobilePlacement : (item.placement || meta.placement || 'top_hanging');
    var isWebSlot = placement === 'top_left' || placement === 'top_right' || placement === 'bottom_left' || placement === 'bottom_center' || placement === 'bottom_right';
    var isFloating = isWebSlot || placement === 'right_floating' || placement === 'left_floating';
    var containerId = isFloating ? 'mskActiveFloatingContainer' : 'mskActiveTopContainer';

    var existing = document.getElementById(containerId);
    if (existing && existing._cleanup) { try { existing._cleanup(); } catch (_) {} }
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    if (isFloating) {
      var existingTab = document.getElementById('mskActiveFloatingTab');
      if (existingTab && existingTab.parentNode) existingTab.parentNode.removeChild(existingTab);
    }

    var langMode = item.langMode || meta.langMode || 'sync';
    var rotateLangs = (item.rotateLangs && Array.isArray(item.rotateLangs) && item.rotateLangs.length > 0)
      ? item.rotateLangs
      : (meta.rotateLangs && Array.isArray(meta.rotateLangs) && meta.rotateLangs.length > 0 ? meta.rotateLangs : ['tr', 'en', 'ar']);
    var fixedLang = item.fixedLang || meta.fixedLang || 'tr';

    var currentLang = (langMode === 'fixed') ? fixedLang : ((langMode === 'rotate') ? rotateLangs[0] : getLang());
    var content = getItemContent(item, currentLang);
    if (!content || !content.trim()) return;

    injectStyles();

    var themeKey = item.bannerType || meta.bannerType || 'info';
    var theme = BANNER_THEMES[themeKey] || BANNER_THEMES.info;
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.body.classList.contains('dark-theme');
    var currentBg = themeKey === 'custom' ? (item.customBg || (isDark ? '#1e293b' : '#f8fafc')) : (isDark ? theme.bgDark : theme.bgLight);
    var currentText = themeKey === 'custom' ? (item.customText || (isDark ? '#f8fafc' : '#0f172a')) : (isDark ? theme.textDark : theme.textLight);
    var currentBorder = isDark ? theme.borderDark : theme.borderLight;
    var bgOpacityVal = (typeof item.bgOpacity === 'number') ? (item.bgOpacity / 100) : (typeof item.opacity === 'number' ? (item.opacity / 100) : 0.95);
    var textOpacityVal = (typeof item.textOpacity === 'number') ? (item.textOpacity / 100) : 1.0;

    var ctaHtml = '';
    var ctaText = item.ctaText || meta.ctaText;
    var ctaUrl = item.ctaUrl || meta.ctaUrl;
    var activeUrl = item.targetUrl || ctaUrl;
    if (ctaText && ctaUrl) {
      ctaHtml = '<a href="' + ctaUrl + '" target="_blank" rel="noopener noreferrer" class="msk-ann-cta-btn" style="background:' + theme.accent + '; color:#ffffff;"><span>' + ctaText + '</span> ➔</a>';
    }

    var isDismissable = item.isDismissable !== false && meta.isDismissable !== false;
    var closeBtnHtml = isDismissable ? '<button type="button" class="msk-ann-close-btn" aria-label="Kapat" title="Kapat">✕</button>' : '';
    var sizePreset = item.sizePreset || meta.sizePreset || 'standard';
    var isTicker = (item.displayMode || meta.displayMode) === 'ticker';
    var isRotator = (item.displayMode || meta.displayMode) === 'rotator';

    var container = document.createElement('div');
    container.id = containerId;
    container.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

    if (isFloating) {
      var cardW = (isMob && typeof item.mobileCardWidth === 'number') ? item.mobileCardWidth : (item.cardWidth || (sizePreset === 'compact' ? 260 : sizePreset === 'large' ? 380 : 310));
      var cardPadY = item.paddingY !== undefined ? item.paddingY : (sizePreset === 'compact' ? 8 : sizePreset === 'large' ? 14 : 10);
      var padCard = cardPadY + 'px ' + (sizePreset === 'compact' ? '10px' : sizePreset === 'large' ? '16px' : '12px');
      var topOff = (isMob && typeof item.mobileTopOffset === 'number') ? item.mobileTopOffset : ((typeof item.topOffset === 'number') ? item.topOffset : (placement.indexOf('top_') === 0 ? 20 : 110));
      var bottomOff = (isMob && typeof item.mobileBottomOffset === 'number') ? item.mobileBottomOffset : ((typeof item.bottomOffset === 'number') ? item.bottomOffset : 20);
      var sideOff = (isMob && typeof item.mobileHorizontalOffset === 'number') ? item.mobileHorizontalOffset : ((typeof item.horizontalOffset === 'number') ? item.horizontalOffset : ((typeof item.sideOffset === 'number') ? item.sideOffset : (isWebSlot ? 20 : 5)));
      var autoDelay = (typeof item.autoCollapseDelay === 'number') ? item.autoCollapseDelay : 10;

      container.className = 'msk-announcement-floating' + (placement === 'left_floating' ? ' msk-floating-left' : (placement === 'right_floating' ? ' msk-floating-right' : ''));
      container.style.width = cardW + 'px';
      container.style.maxWidth = 'calc(100vw - ' + Math.max(16, sideOff * 2) + 'px)';
      container.style.fontSize = sizePreset === 'compact' ? '11px' : sizePreset === 'large' ? '14px' : '12px';
      container.style.color = currentText;
      container.style.overflow = 'hidden';
      if (currentBorder) container.style.border = currentBorder;
      var cardH = (isMob && typeof item.mobileCardHeight === 'number') ? item.mobileCardHeight : item.cardHeight;
      if (cardH) container.style.height = cardH + 'px';
      if ((item.glassEffect || meta.glassEffect) === 'blur') {
        container.style.backdropFilter = 'blur(10px)';
        container.style.webkitBackdropFilter = 'blur(10px)';
      }

      if (placement === 'top_left' || placement === 'left_floating') { container.style.top = topOff + 'px'; container.style.left = sideOff + 'px'; }
      else if (placement === 'top_right' || placement === 'right_floating') { container.style.top = topOff + 'px'; container.style.right = sideOff + 'px'; }
      else if (placement === 'bottom_left') { container.style.bottom = bottomOff + 'px'; container.style.left = sideOff + 'px'; }
      else if (placement === 'bottom_right') { container.style.bottom = bottomOff + 'px'; container.style.right = sideOff + 'px'; }
      else if (placement === 'bottom_center') { container.style.bottom = bottomOff + 'px'; container.style.left = '50%'; container.style.transform = 'translateX(calc(-50% + ' + (sideOff - 20) + 'px))'; }

      container.innerHTML = `
        <div class="msk-ann-bg-layer" style="position:absolute; inset:0; z-index:0; pointer-events:none; background:${currentBg}; opacity:${bgOpacityVal};"></div>
        <div class="msk-ann-floating-inner" style="position:relative; z-index:1; opacity:${textOpacityVal}; padding:${padCard}; height:100%; display:flex; flex-direction:column; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap:8px;">
            <div style="font-size:11px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase;">${item.title || 'Duyuru & Kampanya'}</div>
            ${closeBtnHtml}
          </div>
          <div class="msk-ann-content" style="flex:1;">${content}</div>
          ${ctaHtml ? '<div style="margin-top:10px; display:flex; justify-content:flex-end;">' + ctaHtml + '</div>' : ''}
        </div>
      `;

      var tabEl = document.createElement('div');
      tabEl.id = 'mskActiveFloatingTab';
      tabEl.className = 'msk-ann-tab ' + (placement.indexOf('top_') === 0 || (!isMob && (placement === 'left_floating' || placement === 'right_floating')) ? 'msk-ann-tab-top' : (placement.indexOf('bottom_') === 0 ? 'msk-ann-tab-bottom' : (placement === 'left_floating' ? 'msk-ann-tab-left' : 'msk-ann-tab-right')));
      tabEl.style.background = currentBg;
      tabEl.style.color = currentText;
      if (currentBorder) tabEl.style.borderColor = currentBorder;
      tabEl.innerHTML = `<span style="line-height:1.2; padding:2px 0;">${item.tabText || 'SİZİN İÇİN'}</span>`;

      var isCollapsed = autoDelay <= 0;
      var collapseTimer = null;
      var isHovered = false;

      container.style.display = isCollapsed ? 'none' : 'flex';
      container.style.opacity = isCollapsed ? '0' : '1';
      tabEl.style.display = isCollapsed ? 'flex' : 'none';
      tabEl.style.opacity = isCollapsed ? '1' : '0';

      document.body.appendChild(container);
      document.body.appendChild(tabEl);

      function collapseToTab() {
        if (isCollapsed) return;
        isCollapsed = true;
        container.style.opacity = '0';
        setTimeout(function () {
          container.style.display = 'none';
          tabEl.style.display = 'flex';
          setTimeout(function () { tabEl.style.opacity = '1'; }, 20);
        }, 200);
      }
      function expandToCard() {
        if (!isCollapsed) return;
        isCollapsed = false;
        tabEl.style.opacity = '0';
        setTimeout(function () {
          tabEl.style.display = 'none';
          container.style.display = 'flex';
          setTimeout(function () { container.style.opacity = '1'; }, 20);
        }, 200);
      }
      tabEl.addEventListener('click', function (e) { e.stopPropagation(); expandToCard(); });

      if (autoDelay > 0) {
        container.addEventListener('mouseenter', function () { isHovered = true; if (collapseTimer) clearTimeout(collapseTimer); });
        container.addEventListener('mouseleave', function () { isHovered = false; collapseTimer = setTimeout(collapseToTab, 1500); });
        collapseTimer = setTimeout(function () { if (!isHovered) collapseToTab(); }, autoDelay * 1000);
      }
      var closeBtn = container.querySelector('.msk-ann-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); collapseToTab(); });
      if (item.autoCollapseOnScroll !== false) {
        window.addEventListener('scroll', function () { if (!isCollapsed && window.scrollY > 30) collapseToTab(); }, { passive: true });
      }
      document.addEventListener('click', function (e) { if (!isCollapsed && !container.contains(e.target) && !tabEl.contains(e.target)) collapseToTab(); });
    } else {
      var minH = item.customHeight || (sizePreset === 'compact' ? 26 : sizePreset === 'large' ? 48 : 34);
      var padY = item.paddingY !== undefined ? item.paddingY : (sizePreset === 'compact' ? 1 : sizePreset === 'large' ? 3 : 2);
      container.className = 'msk-announcement-hanging';
      container.style.minHeight = minH + 'px';
      if (isTicker) container.style.height = minH + 'px';
      container.style.overflow = 'hidden';
      container.style.fontSize = sizePreset === 'compact' ? '11px' : sizePreset === 'large' ? '14px' : '12px';
      container.style.color = currentText;
      if (currentBorder) container.style.borderBottom = currentBorder;
      if ((item.glassEffect || meta.glassEffect) === 'blur') {
        container.style.backdropFilter = 'blur(10px)';
        container.style.webkitBackdropFilter = 'blur(10px)';
      }
      var headerEl = document.querySelector('header.site-header-sticky') || document.querySelector('header');
      container.style.top = (headerEl ? headerEl.offsetHeight : 84) + 'px';

      var bodyHtml = '';
      if (isTicker) {
        var curSpeed = item.tickerSpeed || meta.tickerSpeed;
        var isArabic = (currentLang === 'ar');
        var isRev = isArabic ? ((item.tickerDirection || meta.tickerDirection) !== 'ltr') : ((item.tickerDirection || meta.tickerDirection) === 'ltr');
        var speedSec = curSpeed === 'slow' ? '30s' : curSpeed === 'fast' ? '12s' : '20s';
        var animStyle = 'mskMarqueeRTL ' + speedSec + ' linear infinite ' + (isRev ? 'reverse' : 'normal');
        bodyHtml = '<div class="msk-ticker-wrap"><div class="msk-ticker-track" dir="' + (isArabic ? 'rtl' : 'ltr') + '" style="animation: ' + animStyle + ';">' + formatTickerHtml(content) + '</div></div>';
      } else if (isRotator) {
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        var pEls = tempDiv.querySelectorAll('p');
        var lines = (pEls && pEls.length > 1) ? Array.from(pEls).map(function (p) { return p.innerHTML.trim(); }).filter(Boolean) : tempDiv.innerHTML.split(/<br\s*[\/]?>/gi).map(function (s) { return s.trim(); }).filter(Boolean);
        bodyHtml = '<div class="msk-rotator-wrap" style="height:22px; flex:1; position:relative; overflow:hidden;">' + lines.map(function (ln, idx) {
          return '<div class="msk-rotator-item" style="transition: opacity 0.4s ease, transform 0.4s ease; position:' + (idx === 0 ? 'relative' : 'absolute') + '; top:0; left:0; width:100%; opacity:' + (idx === 0 ? '1' : '0') + '; transform:' + (idx === 0 ? 'translateY(0)' : 'translateY(8px)') + '; pointer-events:' + (idx === 0 ? 'auto' : 'none') + ';">' + ln + '</div>';
        }).join('') + '</div>';
      } else {
        bodyHtml = '<div class="msk-ann-content" style="flex:1; display:flex; align-items:center; line-height:1.25; margin:0;">' + content + '</div>';
      }

      container.innerHTML = `
        <div class="msk-ann-bg-layer" style="position:absolute; inset:0; z-index:0; pointer-events:none; background:${currentBg}; opacity:${bgOpacityVal};"></div>
        <div class="msk-ann-inner" style="position:relative; z-index:1; opacity:${textOpacityVal}; padding:${padY}px 12px; align-items:center; box-sizing:border-box;">
          ${bodyHtml}
          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">${ctaHtml}${closeBtnHtml}</div>
        </div>
      `;
      document.body.appendChild(container);

      if (isRotator) {
        var rotItems = container.querySelectorAll('.msk-rotator-item');
        if (rotItems && rotItems.length > 1) {
          var rotIdx = 0, isRotPaused = false;
          container.addEventListener('mouseenter', function () { isRotPaused = true; });
          container.addEventListener('mouseleave', function () { isRotPaused = false; });
          setInterval(function () {
            if (isRotPaused) return;
            var prev = rotItems[rotIdx];
            rotIdx = (rotIdx + 1) % rotItems.length;
            var next = rotItems[rotIdx];
            if (prev) { prev.style.opacity = '0'; prev.style.transform = 'translateY(-8px)'; prev.style.position = 'absolute'; prev.style.pointerEvents = 'none'; }
            if (next) { next.style.opacity = '1'; next.style.transform = 'translateY(0)'; next.style.position = 'relative'; next.style.pointerEvents = 'auto'; }
          }, 4500);
        }
      }

      var topClose = container.querySelector('.msk-ann-close-btn');
      if (topClose) {
        topClose.addEventListener('click', function (e) {
          e.stopPropagation();
          try { if (container._cleanup) container._cleanup(); } catch (_) {}
          container.style.opacity = '0';
          container.style.transform = 'translateY(-100%)';
          setTimeout(function () { if (container.parentNode) container.parentNode.removeChild(container); }, 260);
          try { sessionStorage.setItem('msk_dismissed_' + item.id, 'true'); } catch (_) {}
        });
      }
    }

    if (activeUrl) {
      container.style.cursor = 'pointer';
      container.addEventListener('click', function(e) {
        if (e.target.closest('.msk-ann-close-btn') || e.target.closest('a')) return;
        window.open(activeUrl, '_blank', 'noopener,noreferrer');
      });
    }

    // Çok Dilli Dinamik Güncelleyici (Sync / Rotate / Fixed)
    function updateBannerLanguage(newLang) {
      currentLang = newLang;
      var newContent = getItemContent(item, newLang);
      if (!newContent || !newContent.trim()) return;
      container.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');

      if (isTicker) {
        var curSpeed = item.tickerSpeed || meta.tickerSpeed;
        var speedSec = curSpeed === 'slow' ? '30s' : curSpeed === 'fast' ? '12s' : '20s';
        var isArabic = (newLang === 'ar');
        var isRev = isArabic ? ((item.tickerDirection || meta.tickerDirection) !== 'ltr') : ((item.tickerDirection || meta.tickerDirection) === 'ltr');
        var animStyle = 'mskMarqueeRTL ' + speedSec + ' linear infinite ' + (isRev ? 'reverse' : 'normal');
        var track = container.querySelector('.msk-ticker-track');
        if (track) {
          track.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
          track.innerHTML = formatTickerHtml(newContent);
          track.style.animation = animStyle;
        }
      } else {
        var contentEl = container.querySelector('.msk-ann-content');
        if (contentEl) {
          contentEl.style.transition = 'opacity 0.2s ease';
          contentEl.style.opacity = '0';
          setTimeout(function () { contentEl.innerHTML = newContent; contentEl.style.opacity = '1'; }, 200);
        }
      }
    }

    var onLangChange = null, htmlObs = null, rotTimer = null;
    if (langMode === 'sync') {
      onLangChange = function (ev) {
        var l = (ev && ev.detail && ev.detail.lang) ? ev.detail.lang : getLang();
        if (l !== currentLang) updateBannerLanguage(l);
      };
      window.addEventListener('languageChanged', onLangChange);
      if (typeof MutationObserver !== 'undefined') {
        htmlObs = new MutationObserver(function () {
          var l = getLang();
          if (l !== currentLang) updateBannerLanguage(l);
        });
        htmlObs.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
      }
    } else if (langMode === 'rotate' && rotateLangs.length > 1) {
      var rotLangIdx = 0;
      if (isTicker) {
        var trackEl = container.querySelector('.msk-ticker-track');
        if (trackEl) {
          trackEl.addEventListener('animationiteration', function () {
            rotLangIdx = (rotLangIdx + 1) % rotateLangs.length;
            updateBannerLanguage(rotateLangs[rotLangIdx]);
          });
        }
      } else {
        rotTimer = setInterval(function () {
          if (document.hidden) return;
          rotLangIdx = (rotLangIdx + 1) % rotateLangs.length;
          updateBannerLanguage(rotateLangs[rotLangIdx]);
        }, 7000);
      }
    }

    container._cleanup = function () {
      if (onLangChange) window.removeEventListener('languageChanged', onLangChange);
      if (htmlObs) htmlObs.disconnect();
      if (rotTimer) clearInterval(rotTimer);
    };
  }

  function hideAllAnnouncementButtons() {
    var btns = document.querySelectorAll('.announcement-trigger-btn, #mskAnnTriggerBtn, #mskAnnTriggerBtnDesk, #mskAnnTriggerBtnMob');
    var badges = document.querySelectorAll('.msk-ann-badge, #mskAnnBadge');
    btns.forEach(function (b) { b.classList.remove('has-announcements'); b.style.setProperty('display', 'none', 'important'); });
    badges.forEach(function (b) { b.style.display = 'none'; });
  }

  function setupHeaderTrigger(activeItems, meta, currentItem) {
    var triggerBtns = document.querySelectorAll('.announcement-trigger-btn, #mskAnnTriggerBtn, #mskAnnTriggerBtnDesk, #mskAnnTriggerBtnMob');
    var badges = document.querySelectorAll('.msk-ann-badge, #mskAnnBadge');
    if (!triggerBtns || triggerBtns.length === 0) return;
    if (!activeItems || activeItems.length === 0) { hideAllAnnouncementButtons(); return; }

    triggerBtns.forEach(function (btn) {
      btn.classList.add('has-announcements');
      btn.style.removeProperty('display');
      btn.onclick = function (e) {
        e.stopPropagation();
        var existingPop = document.getElementById('mskAnnPopoverMenu');
        if (existingPop) { existingPop.parentNode.removeChild(existingPop); return; }

        injectStyles();
        var popover = document.createElement('div');
        popover.id = 'mskAnnPopoverMenu';
        popover.className = 'msk-ann-popover';
        popover.style.position = 'fixed';
        popover.style.zIndex = '10001';
        popover.style.top = '84px';
        popover.style.right = '20px';
        try {
          var rect = btn.getBoundingClientRect();
          if (rect && rect.bottom > 0) {
            popover.style.top = (Math.round(rect.bottom) + 8) + 'px';
            popover.style.right = Math.max(16, Math.round(window.innerWidth - rect.right)) + 'px';
          }
        } catch (_) {}

        var listHtml = activeItems.map(function (it, idx) {
          var dotColor = it.bannerType === 'success' ? '#10b981' : it.bannerType === 'warning' ? '#f59e0b' : it.bannerType === 'purple' ? '#8b5cf6' : '#3b82f6';
          var isCurrent = it.id === currentItem.id;
          return `<div class="msk-ann-popover-item" data-ann-id="${it.id}">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${dotColor}; flex-shrink:0;"></span>
            <span style="flex:1; font-weight:${isCurrent ? '700' : '500'};">${it.title || ('Duyuru #' + (idx + 1))}</span>
            ${isCurrent ? '<span style="font-size:10px; opacity:0.7;">(Aktif)</span>' : ''}
          </div>`;
        }).join('');

        popover.innerHTML = `
          <div style="padding:10px 14px; background:rgba(128,128,128,0.08); font-size:11px; font-weight:800; display:flex; justify-content:space-between; align-items:center;">
            <span style="display:inline-flex; align-items:center; gap:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block; flex-shrink:0;">
                <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
                <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14"/>
                <path d="M8 6v8"/>
              </svg>
              DUYURULAR & KAMPANYALAR (${activeItems.length})
            </span>
            <button type="button" id="mskClosePopBtn" style="background:none; border:none; cursor:pointer; font-size:14px; color:inherit;">✕</button>
          </div>
          <div style="max-height:220px; overflow-y:auto;">${listHtml}</div>
          <div style="padding:8px 12px; background:rgba(128,128,128,0.05); text-align:center;">
            <button type="button" id="mskToggleBannerVisibilityBtn" style="font-size:11px; padding:4px 10px; border-radius:6px; border:1px solid rgba(128,128,128,0.3); background:transparent; color:inherit; cursor:pointer;">
              Şeridi Yeniden Göster / Gizle
            </button>
          </div>
        `;
        document.body.appendChild(popover);

        popover.querySelector('#mskClosePopBtn').onclick = function () { popover.parentNode.removeChild(popover); };
        popover.querySelector('#mskToggleBannerVisibilityBtn').onclick = function () {
          var topB = document.getElementById('mskActiveTopContainer');
          var floatB = document.getElementById('mskActiveFloatingContainer');
          var floatTab = document.getElementById('mskActiveFloatingTab');
          if (topB || floatB || floatTab) {
            if (topB && topB.parentNode) topB.parentNode.removeChild(topB);
            if (floatB && floatB.parentNode) floatB.parentNode.removeChild(floatB);
            if (floatTab && floatTab.parentNode) floatTab.parentNode.removeChild(floatTab);
          } else {
            renderAnnouncementBanner(currentItem, meta, activeItems);
          }
          popover.parentNode.removeChild(popover);
        };
        popover.querySelectorAll('.msk-ann-popover-item').forEach(function (el) {
          el.onclick = function () {
            var selected = activeItems.find(function (x) { return x.id === el.getAttribute('data-ann-id'); }) || activeItems[0];
            currentItem = selected;
            renderAnnouncementBanner(selected, meta, activeItems);
            popover.parentNode.removeChild(popover);
          };
        });
        document.addEventListener('click', function closeOut(ev) {
          if (!popover.contains(ev.target) && !btn.contains(ev.target)) {
            if (popover.parentNode) popover.parentNode.removeChild(popover);
            document.removeEventListener('click', closeOut);
          }
        });
      };
    });

    badges.forEach(function (b) { b.style.display = 'inline-block'; b.textContent = activeItems.length; });
    if (typeof window.syncAnnouncementPosition === 'function') {
      window.syncAnnouncementPosition();
      setTimeout(window.syncAnnouncementPosition, 50);
    }
  }

  function initAnnouncementLoader() {
    injectStyles();
    var apiUrl = (window.SITE_CONFIG && window.SITE_CONFIG.apiUrl) ? window.SITE_CONFIG.apiUrl : 'https://msklabsdesk-backend.msklabs-org.workers.dev/api';

    fetch(apiUrl + '/v1/templates?_t=' + Date.now(), { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Templates API HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var templates = data.templates || [];
        var ann = null;
        for (var i = 0; i < templates.length; i++) {
          if (templates[i].key_name === 'announcement_bar') { ann = templates[i]; break; }
        }
        if (!ann || (ann.is_active !== undefined && (ann.is_active === 0 || ann.is_active === false))) {
          hideAllAnnouncementButtons();
          return;
        }

        var meta = {};
        if (ann.meta_json) {
          try { meta = typeof ann.meta_json === 'string' ? JSON.parse(ann.meta_json) : ann.meta_json; } catch (_) {}
        }

        var pool = (meta.items && Array.isArray(meta.items) && meta.items.length > 0) ? meta.items : [{
          id: 'ann_default', title: 'Ana Duyuru', content_tr: ann.content_tr || '', content_en: ann.content_en || '', content_ar: ann.content_ar || '',
          bannerType: meta.bannerType || 'info', placement: meta.placement || 'top_hanging', sizePreset: meta.sizePreset || 'standard',
          isDismissable: meta.isDismissable !== false, ctaText: meta.ctaText, ctaUrl: meta.ctaUrl, targetUrl: meta.targetUrl, isActive: true,
        }];

        var activeItems = pool.filter(function (it) { return it.isActive !== false; });
        if (activeItems.length === 0) { hideAllAnnouncementButtons(); return; }

        var isMob = window.innerWidth <= 768;
        var filteredPool = activeItems.filter(function (it) {
          if (it.deviceTarget === 'desktop' && isMob) return false;
          if (it.deviceTarget === 'mobile' && !isMob) return false;
          var pl = (isMob && it.mobilePlacement) ? it.mobilePlacement : (it.placement || meta.placement || 'top_hanging');
          return isMob ? (pl === 'left_floating' || pl === 'right_floating' || pl === 'top_hanging' || pl.indexOf('bottom_') === 0 || pl.indexOf('top_') === 0)
                       : (pl === 'top_left' || pl === 'top_right' || pl === 'bottom_left' || pl === 'bottom_center' || pl === 'bottom_right' || pl === 'top_hanging');
        });

        var displayPool = filteredPool.length > 0 ? filteredPool : activeItems;
        var lastIdx = -1;
        try { lastIdx = parseInt(localStorage.getItem('msk_last_single_ann_idx') || '-1', 10); } catch (_) {}
        var nextIdx = (isNaN(lastIdx) || lastIdx < 0 || lastIdx >= displayPool.length - 1) ? 0 : (lastIdx + 1);
        var chosenItem = displayPool[nextIdx];
        try { localStorage.setItem('msk_last_single_ann_idx', nextIdx.toString()); } catch (_) {}

        var isItemDismissed = false;
        try { isItemDismissed = sessionStorage.getItem('msk_dismissed_' + chosenItem.id) === 'true'; } catch (_) {}
        if (chosenItem && !isItemDismissed) {
          renderAnnouncementBanner(chosenItem, meta, activeItems);
        }

        setupHeaderTrigger(activeItems, meta, activeItems[0]);
      })
      .catch(function (err) {
        hideAllAnnouncementButtons();
        console.warn('[MSK Announcement] Hata:', err.message);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnnouncementLoader);
  } else {
    initAnnouncementLoader();
  }
})();
