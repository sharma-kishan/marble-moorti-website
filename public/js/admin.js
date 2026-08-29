(function () {
  'use strict';

  /* CSRF token, read once from the meta tag the admin layout renders.
     Attached as a header on every fetch() call below, and auto-injected
     as a hidden field into any plain <form> that doesn't already carry one.
     Multipart upload forms carry the token in their action URL's query
     string instead — see the admin form templates under views/admin. */
  var csrfMeta = document.querySelector('meta[name="csrf-token"]');
  var csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

  document.querySelectorAll('form').forEach(function (form) {
    var isMultipart = (form.getAttribute('enctype') || '').indexOf('multipart') !== -1;
    if (isMultipart) return; // token already in the action URL's query string
    if (form.querySelector('input[name="_csrf"]')) return;
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = '_csrf';
    input.value = csrfToken;
    form.appendChild(input);
  });

  /* Confirm before any destructive form submit */
  document.querySelectorAll('[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm(form.getAttribute('data-confirm'))) {
        e.preventDefault();
      }
    });
  });

  /* Toggle publish state via the small JSON API without leaving the list page */
  document.querySelectorAll('[data-toggle-publish]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-toggle-publish');
      fetch('/api/admin/products/' + id + '/publish', {
        method: 'PATCH',
        headers: { 'CSRF-Token': csrfToken },
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            btn.textContent = data.published ? 'Published' : 'Unpublished';
            btn.classList.toggle('status-Confirmed', data.published);
            btn.classList.toggle('status-Cancelled', !data.published);
          }
        })
        .catch(function () { window.alert('Could not update status. Please try again.'); });
    });
  });

  /* Delete a single product image inline in the edit form */
  document.querySelectorAll('[data-delete-image]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!window.confirm('Remove this image?')) return;
      var productId = btn.getAttribute('data-product-id');
      var imageId = btn.getAttribute('data-delete-image');
      fetch('/api/admin/products/' + productId + '/images/' + imageId, {
        method: 'DELETE',
        headers: { 'CSRF-Token': csrfToken },
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            btn.closest('.image-thumb').remove();
          }
        });
    });
  });

  /* Delete a gallery image inline from the gallery list page */
  document.querySelectorAll('[data-delete-gallery]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!window.confirm('Delete this image?')) return;
      var id = btn.getAttribute('data-delete-gallery');
      fetch('/admin/gallery/' + id + '/delete', {
        method: 'POST',
        headers: { 'CSRF-Token': csrfToken },
      }).then(function () { window.location.reload(); });
    });
  });

  /* Quick status update on enquiry detail page */
  var statusSelect = document.getElementById('enquiryStatusSelect');
  if (statusSelect) {
    statusSelect.addEventListener('change', function () {
      document.getElementById('enquiryStatusForm').submit();
    });
  }

  /* Mobile sidebar toggle */
  var sidebarToggle = document.getElementById('adminSidebarToggle');
  var sidebar = document.querySelector('.admin-sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('is-open');
    });
  }

  /* Auto-dismiss flash toasts */
  document.querySelectorAll('.flash').forEach(function (el) {
    setTimeout(function () {
      el.style.transition = 'opacity 0.4s ease';
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 400);
    }, 5000);
  });

  /* Multi-file input preview count */
  document.querySelectorAll('input[type="file"][multiple]').forEach(function (input) {
    input.addEventListener('change', function () {
      var label = document.querySelector('[data-file-count-for="' + input.id + '"]');
      if (label) label.textContent = input.files.length + ' file(s) selected';
    });
  });
})();
