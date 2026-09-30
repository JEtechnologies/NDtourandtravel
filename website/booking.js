'use strict';

function journeyToday() {
  var parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata', year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  var value = function(type) { return parts.find(function(part) { return part.type === type; }).value; };
  return value('year') + '-' + value('month') + '-' + value('day');
}

(function() {
  var form = document.getElementById('bookingForm') || document.getElementById('serviceForm');
  if (!form) return;
  var success = document.getElementById('formSuccess');
  var container = document.getElementById('formContainer') || document.getElementById('formArea');
  var field = function(id) { return document.getElementById(id); };
  var value = function(id) { return field(id) ? field(id).value.trim() : ''; };
  field('jdate').min = journeyToday();

  form.querySelectorAll('input,select,textarea').forEach(function(input) {
    var group = input.closest('.form-group');
    var label = group && group.querySelector('label');
    if (label && !label.htmlFor && input.type !== 'radio') label.htmlFor = input.id;
    if (['text','email','tel'].includes(input.type)) input.maxLength = input.id === 'mobile' ? 10 : 200;
    if (input.tagName === 'TEXTAREA') input.maxLength = 1000;
  });
  field('fname').autocomplete = 'name';
  field('mobile').autocomplete = 'tel-national';
  field('mobile').inputMode = 'numeric';
  field('email').autocomplete = 'email';
  var note = document.createElement('p');
  note.style.cssText = 'font-size:0.85rem;color:#475569;margin-top:14px';
  note.textContent = 'No payment required. Booking is confirmed directly by our team. Details are not stored on this website.';
  form.appendChild(note);

  function edit() {
    success.classList.remove('show');
    Array.from(container.children).forEach(function(el) { el.style.display = ''; });
    field('fname').focus({preventScroll:true});
  }
  field('editEnquiry').addEventListener('click', edit);
  window.openEnquiry = function(selection, type) {
    edit();
    var select = field(type === 'vehicle' ? 'vehicle' : 'serviceType');
    if (select && Array.from(select.options).some(function(option) { return option.value === selection; })) select.value = selection;
    document.getElementById('booking').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  };

  function error(id, text) {
    var input = field(id);
    input.classList.add('error');
    input.setAttribute('aria-invalid','true');
    var message = input.parentElement.querySelector('.error-msg');
    if (!message) { message = document.createElement('div'); message.className = 'error-msg'; message.id = id + 'Err'; input.after(message); }
    message.textContent = text;
    message.classList.add('show');
    input.setAttribute('aria-describedby',message.id);
  }

  form.addEventListener('submit', function(event) {
    event.preventDefault();
    form.querySelectorAll('.error').forEach(function(el) { el.classList.remove('error'); el.removeAttribute('aria-invalid'); });
    form.querySelectorAll('.error-msg').forEach(function(el) { el.classList.remove('show'); });
    ['fname','pickup','drop'].forEach(function(id) { if (!value(id)) error(id, 'Please complete this field.'); });
    if (!/^[6-9]\d{9}$/.test(value('mobile'))) error('mobile','Enter a valid 10-digit Indian mobile number.');
    if (value('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email'))) error('email','Enter a valid email address.');
    if (field('serviceType') && !value('serviceType')) error('serviceType','Choose a service.');
    field('jdate').min = journeyToday();
    if (!value('jdate') || value('jdate') < journeyToday()) error('jdate','Choose today or a future date.');
    if (field('passengers') && value('passengers') && (!Number.isInteger(Number(value('passengers'))) || Number(value('passengers')) < 1 || Number(value('passengers')) > 50)) error('passengers','Enter between 1 and 50 passengers.');
    var firstError = form.querySelector('.error');
    if (firstError) { firstError.focus(); return; }
    var returnInput = form.querySelector('input[name="returnJ"]:checked');
    var entries = [
      ['Name',value('fname')],['Phone',value('mobile')],['Email',value('email') || 'Not provided'],
      ['Pickup',value('pickup')],['Drop',value('drop')],['Date',value('jdate')],['Time',value('jtime') || 'Not specified'],
      ['Service',value('serviceType') || form.dataset.service],['Vehicle',value('vehicle') || 'No preference'],
      ['Passengers',value('passengers') || 'To be confirmed'],['Return Journey',returnInput ? returnInput.value : 'To be confirmed'],
      ['Message',value('message') || 'None']
    ];
    var summary = entries.map(function(entry) { return entry[0] + ': ' + entry[1]; }).join('\n');
    field('enquirySummary').textContent = summary;
    field('waLink').href = 'https://wa.me/919896547757?text=' + encodeURIComponent('Hello N D Tour & Travel,\n\nI would like to enquire about a taxi/travel service.\n\n' + summary + '\n\nPlease share availability and quotation.');
    Array.from(container.children).forEach(function(el) { el.style.display = 'none'; });
    success.classList.add('show');
    success.focus();
  });
  var hamburger = field('hamburger');
  var nav = field('nav');
  if (hamburger && nav) {
    hamburger.setAttribute('aria-controls','nav');
    hamburger.setAttribute('aria-expanded','false');
    new MutationObserver(function() { hamburger.setAttribute('aria-expanded',String(nav.classList.contains('open'))); }).observe(nav,{attributes:true,attributeFilter:['class']});
    document.addEventListener('keydown',function(event) { if(event.key === 'Escape') { nav.classList.remove('open'); hamburger.classList.remove('active'); } });
  }
})();
