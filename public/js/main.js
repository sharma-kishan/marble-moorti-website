(function () {
  'use strict';

  /* Sticky header shadow on scroll */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 12) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile nav toggle */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* Fade-in-on-scroll for elements marked .fade-in */
  var fadeEls = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window && fadeEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    fadeEls.forEach(function (el) { io.observe(el); });
  } else {
    fadeEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Animated counters for trust statistics */
  var counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    var animate = function (el) {
      var target = parseInt(el.getAttribute('data-counter'), 10);
      if (isNaN(target)) return;
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1400;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var value = Math.floor(progress * target);
        el.textContent = value.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animate(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(animate);
    }
  }

  /* Product detail gallery: thumbnail click swaps main image */
  var mainImg = document.getElementById('productMainImage');
  var thumbs = document.querySelectorAll('.product-gallery__thumbs img');
  if (mainImg && thumbs.length) {
    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        mainImg.src = thumb.getAttribute('data-full');
        thumbs.forEach(function (t) { t.classList.remove('is-active'); });
        thumb.classList.add('is-active');
      });
    });
  }

  /* Lightbox for gallery + product images */
  var lightbox = document.querySelector('.lightbox-overlay');
  if (lightbox) {
    var lightboxImg = lightbox.querySelector('img');
    document.querySelectorAll('[data-lightbox]').forEach(function (el) {
      el.addEventListener('click', function () {
        lightboxImg.src = el.getAttribute('data-lightbox');
        lightbox.classList.add('is-open');
      });
    });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
        lightbox.classList.remove('is-open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') lightbox.classList.remove('is-open');
    });
  }

  /* Products page: AJAX-ish filtering (progressive enhancement over plain <form>) */
  var filterForm = document.getElementById('productFilterForm');
  if (filterForm) {
    filterForm.querySelectorAll('select').forEach(function (select) {
      select.addEventListener('change', function () { filterForm.submit(); });
    });
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-item__question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var wasOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item.is-open').forEach(function (el) { el.classList.remove('is-open'); });
      if (!wasOpen) item.classList.add('is-open');
    });
  });
})();
