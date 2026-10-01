/* POP Chat · interaction
 *
 * Motion budget (Lumen Day Foundry — no perpetual loops):
 *   1. hero entrance      — mark / title / lede / actions stagger, CSS on load
 *   2. verb landmark      — 1px underline draw-in, 320ms, once
 *   3. scroll reveal      — IntersectionObserver, staggered via --i
 *   4. apparatus sequence — one-shot: pulse travels, lands, blocked node acks
 *   5. hover states       — card lift + one-shot sheen, nav underline, spec row
 *   6. theme toggle       — smooth color transitions with localStorage persistence
 *   7. loader             — skeleton screen with shimmer, fades on load
 */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ─── Theme Toggle · light/dark with localStorage ────────── */
  var themeToggle = document.getElementById("themeToggle");
  var themeToggleSheet = document.getElementById("themeToggleSheet");
  var htmlEl = document.documentElement;

  function getStoredTheme() {
    try {
      return localStorage.getItem("theme");
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      /* ignore */
    }
  }

  function getPreferredTheme() {
    var stored = getStoredTheme();
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function updateToggleLabels(theme) {
    var label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    var labelText = theme === "dark" ? "Light mode" : "Dark mode";
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", label);
    }
    if (themeToggleSheet) {
      themeToggleSheet.setAttribute("aria-label", label);
      var labelEl = themeToggleSheet.querySelector(".theme-toggle__label");
      if (labelEl) labelEl.textContent = labelText;
    }
  }

  function applyTheme(theme, skipTransition) {
    if (skipTransition) {
      htmlEl.setAttribute("data-theme-transitioning", "");
    }
    htmlEl.setAttribute("data-theme", theme);
    updateToggleLabels(theme);
    // Force reflow to ensure transitioning attribute takes effect
    if (skipTransition) {
      htmlEl.offsetHeight; // eslint-disable-line no-unused-expressions
      htmlEl.removeAttribute("data-theme-transitioning");
    }
    setStoredTheme(theme);
  }

  function initTheme() {
    var theme = getPreferredTheme();
    applyTheme(theme, true); // skip transition on initial load
  }

  function onThemeToggleClick() {
    var current = htmlEl.getAttribute("data-theme") || "light";
    var next = current === "dark" ? "light" : "dark";
    applyTheme(next, false);
  }

  function bindThemeToggles() {
    themeToggle = document.getElementById("themeToggle");
    themeToggleSheet = document.getElementById("themeToggleSheet");

    if (themeToggle && !themeToggle._bound) {
      themeToggle.addEventListener("click", onThemeToggleClick);
      themeToggle._bound = true;
    }
    if (themeToggleSheet && !themeToggleSheet._bound) {
      themeToggleSheet.addEventListener("click", onThemeToggleClick);
      themeToggleSheet._bound = true;
    }
    // Update labels after binding
    var currentTheme = htmlEl.getAttribute("data-theme") || "light";
    updateToggleLabels(currentTheme);
  }

  // Initial bind
  bindThemeToggles();

  // Re-bind if elements are added later (e.g., after navigation)
  if ("MutationObserver" in window) {
    var mo = new MutationObserver(function () {
      bindThemeToggles();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // Listen for system theme changes (only if user hasn't set a preference)
  try {
    var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    var hasStored = !!getStoredTheme();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", function (e) {
        if (!hasStored && !getStoredTheme()) {
          applyTheme(e.matches ? "dark" : "light", false);
        }
      });
    }
  } catch (e) {
    /* ignore */
  }

  /* ─── Loader · hide after content ready ──────────────────── */
  var loader = document.getElementById("loader");

  function hideLoader() {
    if (!loader) return;
    // Wait for fonts and initial paint
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        requestAnimationFrame(function () {
          loader.classList.add("is-hidden");
          // Remove from DOM after transition
          setTimeout(function () {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
          }, 600);
        });
      });
    } else {
      requestAnimationFrame(function () {
        loader.classList.add("is-hidden");
        setTimeout(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 600);
      });
    }
  }

  // Hide loader when page is fully loaded
  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader);
  }

  /* ─── Nav · scrolled state + scroll progress ───────────── */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("navProgress");
  var ticking = false;

  function syncScroll() {
    ticking = false;

    if (nav) {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      progress.style.setProperty("--progress", ratio.toFixed(4));
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(syncScroll);
  }

  /* ─── Mobile sheet ─────────────────────────────────────── */
  var toggle = document.getElementById("navToggle");
  var sheet = document.getElementById("sheet");
  var sheetOpen = false;
  var closeTimer = null;

  function openSheet() {
    if (!sheet || !toggle || sheetOpen) return;
    clearTimeout(closeTimer);
    sheetOpen = true;
    sheet.hidden = false;
    // next frame so the transition has a start value to move from
    window.requestAnimationFrame(function () {
      sheet.classList.add("is-open");
    });
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  }

  function closeSheet() {
    if (!sheet || !toggle || !sheetOpen) return;
    sheetOpen = false;
    sheet.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    closeTimer = setTimeout(function () {
      if (!sheetOpen) sheet.hidden = true;
    }, 460);
  }

  if (toggle && sheet) {
    toggle.addEventListener("click", function () {
      if (sheetOpen) closeSheet(); else openSheet();
    });

    sheet.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeSheet();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !sheetOpen) return;
      closeSheet();
      toggle.focus();
    });

    document.addEventListener("click", function (e) {
      if (!sheetOpen) return;
      if (sheet.contains(e.target) || toggle.contains(e.target)) return;
      closeSheet();
    });

    // a resize past the desktop breakpoint hides the toggle, so the sheet must go
    var wide = window.matchMedia("(min-width: 62rem)");
    var onWide = function (e) { if (e.matches) closeSheet(); };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* ─── Reveal on enter · Scroll-locked animations ─────────── */
  var revealTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var revealGroupTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal-group"));
  var revealSlideLeftTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal-slide-left"));
  var revealSlideRightTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal-slide-right"));
  var revealScaleTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal-scale"));
  var revealParallaxTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal-parallax"));
  var revealLinesTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal-lines"));
  var revealBlurTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal-blur"));
  var revealRotateTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal-rotate"));
  var revealClipTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal-clip"));
  var revealStackTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal-stack"));
  var revealLettersTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal-letters"));

  function showAll() {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
    revealGroupTargets.forEach(function (el) { el.classList.add("is-in"); });
    revealSlideLeftTargets.forEach(function (el) { el.classList.add("is-in"); });
    revealSlideRightTargets.forEach(function (el) { el.classList.add("is-in"); });
    revealScaleTargets.forEach(function (el) { el.classList.add("is-in"); });
    revealParallaxTargets.forEach(function (el) { el.classList.add("is-in"); });
    revealLinesTargets.forEach(function (el) { el.classList.add("is-in"); });
    revealBlurTargets.forEach(function (el) { el.classList.add("is-in"); });
    revealRotateTargets.forEach(function (el) { el.classList.add("is-in"); });
    revealClipTargets.forEach(function (el) { el.classList.add("is-in"); });
    revealStackTargets.forEach(function (el) { el.classList.add("is-in"); });
    revealLettersTargets.forEach(function (el) { el.classList.add("is-in"); });
  }

  function initReveal() {
    if (reduced.matches || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    // Standard reveal - triggers when element enters viewport
    var ioReveal = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          ioReveal.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0.1 }
    );

    // Reveal group - for staggered children
    var ioGroup = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          ioGroup.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.05 }
    );

    // Slide left/right - slightly earlier trigger
    var ioSlide = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          ioSlide.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    // Scale - triggers a bit earlier for pop effect
    var ioScale = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          ioScale.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.15 }
    );

    // Parallax - for hero elements, triggers earlier
    var ioParallax = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          ioParallax.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px 0% 0px", threshold: 0 }
    );

    // Lines - for text line-by-line
    var ioLines = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          ioLines.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0.1 }
    );

    // Blur, rotate, clip, stack, letters
    var ioBlur = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          ioBlur.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0.1 }
    );

    var ioRotate = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          ioRotate.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    var ioClip = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          ioClip.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.15 }
    );

    var ioStack = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          ioStack.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.05 }
    );

    var ioLetters = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          ioLetters.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    revealTargets.forEach(function (el) { ioReveal.observe(el); });
    revealGroupTargets.forEach(function (el) { ioGroup.observe(el); });
    revealSlideLeftTargets.forEach(function (el) { ioSlide.observe(el); });
    revealSlideRightTargets.forEach(function (el) { ioSlide.observe(el); });
    revealScaleTargets.forEach(function (el) { ioScale.observe(el); });
    revealParallaxTargets.forEach(function (el) { ioParallax.observe(el); });
    revealLinesTargets.forEach(function (el) { ioLines.observe(el); });
    revealBlurTargets.forEach(function (el) { ioBlur.observe(el); });
    revealRotateTargets.forEach(function (el) { ioRotate.observe(el); });
    revealClipTargets.forEach(function (el) { ioClip.observe(el); });
    revealStackTargets.forEach(function (el) { ioStack.observe(el); });
    revealLettersTargets.forEach(function (el) { ioLetters.observe(el); });
  }

  /* ─── Apparatus · one-shot delivery sequence ───────────── */
  var apparatus = document.getElementById("apparatus");

  function initApparatus() {
    if (!apparatus) return;
    if (reduced.matches || !("IntersectionObserver" in window)) {
      apparatus.classList.add("is-in");
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.disconnect();
        });
      },
      { threshold: 0.35 }
    );
    io.observe(apparatus);
  }

  /* ─── Stages · highlight the step at viewport centre ───── */
  var stages = Array.prototype.slice.call(document.querySelectorAll("[data-stage]"));

  function initStages() {
    if (!stages.length || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-current", entry.isIntersecting);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    stages.forEach(function (el) { io.observe(el); });
  }

  /* ─── Boot ─────────────────────────────────────────────── */
  initTheme();
  syncScroll();
  initReveal();
  initApparatus();
  initStages();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  // if the user flips reduced-motion mid-session, don't leave content invisible
  if (reduced.addEventListener) {
    reduced.addEventListener("change", function () {
      if (!reduced.matches) return;
      showAll();
      if (apparatus) apparatus.classList.add("is-in");
    });
  }

  /* ─── Parallax scroll effect for hero ───────────────────── */
  var heroMark = document.querySelector(".hero__mark");
  var heroTitle = document.querySelector(".hero__title");
  var heroLede = document.querySelector(".hero__lede");

  function onParallaxScroll() {
    if (reduced.matches) return;
    var scrolled = window.scrollY;
    var heroHeight = document.querySelector(".hero")?.offsetHeight || 0;
    if (scrolled > heroHeight) return;

    var progress = Math.min(scrolled / heroHeight, 1);
    var translateY = scrolled * 0.3;
    var scale = 1 - progress * 0.05;
    var opacity = 1 - progress * 0.4;

    if (heroMark) {
      heroMark.style.transform = "translateY(" + translateY + "px) scale(" + scale + ")";
      heroMark.style.opacity = opacity;
    }
    if (heroTitle) {
      heroTitle.style.transform = "translateY(" + (translateY * 0.5) + "px)";
      heroTitle.style.opacity = 1 - progress * 0.3;
    }
    if (heroLede) {
      heroLede.style.transform = "translateY(" + (translateY * 0.3) + "px)";
      heroLede.style.opacity = 1 - progress * 0.2;
    }
  }

  window.addEventListener("scroll", onParallaxScroll, { passive: true });
})();
