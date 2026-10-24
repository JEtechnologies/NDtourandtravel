const byId = (id) => document.getElementById(id);
const loginView = byId('login-view');
const adminView = byId('admin-view');
const loginForm = byId('login-form');
const serviceList = byId('service-list');
const editor = byId('service-editor');
let siteContent;

async function api(path, options = {}) {
  const response = await fetch(`/api/admin/${path}`, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
  return result;
}

function announce(message, error = false) {
  const target = byId('status-message');
  target.textContent = message;
  target.classList.toggle('error', error);
  target.hidden = false;
  target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showLogin(message = '') {
  loginView.hidden = false;
  adminView.hidden = true;
  byId('login-message').textContent = message;
}

function fillBusiness() {
  byId('business-name').value = siteContent.business.name || '';
  byId('business-address').value = siteContent.business.address || '';
  byId('business-phone').value = siteContent.business.phone || '';
  byId('business-whatsapp').value = siteContent.business.whatsapp || '';
  byId('business-email').value = siteContent.business.email || '';
}

function renderServices() {
  serviceList.replaceChildren();
  byId('service-count').textContent = siteContent.services.length;
  byId('empty-services').hidden = siteContent.services.length > 0;
  siteContent.services.forEach((service, index) => {
    const row = document.createElement('article');
    row.className = 'service-row';
    if (service.image) {
      const image = document.createElement('img');
      image.className = 'service-thumb'; image.src = service.image; image.alt = '';
      row.append(image);
    } else {
      const placeholder = document.createElement('div'); placeholder.className = 'service-thumb service-placeholder'; placeholder.textContent = 'ND'; row.append(placeholder);
    }
    const main = document.createElement('div'); main.className = 'service-main';
    const title = document.createElement('h3'); title.textContent = service.name;
    const summary = document.createElement('p'); summary.textContent = service.summary;
    const status = document.createElement('div'); status.className = `service-status${service.active === false ? ' off' : ''}`; status.textContent = service.active === false ? 'Hidden from website' : 'Visible on website';
    main.append(title, summary, status); row.append(main);
    const actions = document.createElement('div'); actions.className = 'row-actions';
    const edit = document.createElement('button'); edit.className = 'button ghost small-button'; edit.type = 'button'; edit.textContent = 'Edit'; edit.addEventListener('click', () => openEditor(index));
    const remove = document.createElement('button'); remove.className = 'button ghost small-button danger'; remove.type = 'button'; remove.textContent = 'Delete'; remove.addEventListener('click', () => {
      if (confirm(`Delete “${service.name}” from the website?`)) { siteContent.services.splice(index, 1); renderServices(); }
    });
    actions.append(edit, remove); row.append(actions); serviceList.append(row);
  });
}

function openEditor(index = -1) {
  const service = index < 0 ? { id: '', name: '', summary: '', details: '', image: '', url: '', active: true } : siteContent.services[index];
  byId('service-id').value = index < 0 ? '' : String(index);
  byId('editor-title').textContent = index < 0 ? 'Add a service' : 'Edit service';
  byId('service-name').value = service.name;
  byId('service-summary').value = service.summary;
  byId('service-details').value = service.details || service.summary;
  byId('service-url').value = service.url || '';
  byId('service-active').checked = service.active !== false;
  byId('service-image').value = '';
  byId('service-editor').dataset.image = service.image || '';
  byId('editor-message').textContent = '';
  previewImage(service.image || '');
  editor.showModal();
}

function previewImage(src) {
  byId('image-preview-wrap').hidden = !src;
  byId('image-preview').src = src || '';
}

function slugify(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54) || 'service';
}

async function imageToBase64(file) {
  if (file.size > 2.7 * 1024 * 1024) throw new Error('Choose an image smaller than 2.7 MB.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

byId('service-image').addEventListener('change', () => {
  const file = byId('service-image').files[0];
  if (file) previewImage(URL.createObjectURL(file));
});
byId('remove-image').addEventListener('click', () => { byId('service-editor').dataset.image = ''; byId('service-image').value = ''; previewImage(''); });

byId('service-submit').addEventListener('click', async () => {
  const form = byId('service-form');
  if (!form.reportValidity()) return;
  const submit = byId('service-submit');
  submit.disabled = true; submit.textContent = 'Saving…';
  const message = byId('editor-message'); message.textContent = '';
  try {
    let image = byId('service-editor').dataset.image || '';
    const file = byId('service-image').files[0];
    if (file) {
      const base64 = await imageToBase64(file);
      const uploaded = await api('upload', { method: 'POST', body: JSON.stringify({ mimeType: file.type, image: base64 }) });
      image = uploaded.image;
    }
    const index = byId('service-id').value;
    const name = byId('service-name').value.trim();
    const id = index === '' ? `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}` : siteContent.services[Number(index)].id;
    const item = { id, name, summary: byId('service-summary').value.trim(), details: byId('service-details').value.trim(), image, url: byId('service-url').value.trim(), active: byId('service-active').checked };
    if (index === '') siteContent.services.push(item); else siteContent.services[Number(index)] = item;
    renderServices(); editor.close();
  } catch (error) { message.textContent = error.message; }
  finally { submit.disabled = false; submit.textContent = 'Save service'; }
});

byId('add-service').addEventListener('click', () => openEditor());
byId('save-button').addEventListener('click', async () => {
  const button = byId('save-button');
  button.disabled = true; button.textContent = 'Publishing…';
  byId('status-message').hidden = true;
  siteContent.business = {
    name: byId('business-name').value.trim(),
    address: byId('business-address').value.trim(),
    phone: byId('business-phone').value.trim(),
    whatsapp: byId('business-whatsapp').value.replace(/\D/g, ''),
    email: byId('business-email').value.trim()
  };
  try {
    const result = await api('save', { method: 'POST', body: JSON.stringify(siteContent) });
    announce('Changes saved. Vercel will publish them to your website shortly.');
  } catch (error) { announce(error.message, true); }
  finally { button.disabled = false; button.textContent = 'Save all changes'; }
});

byId('logout-button').addEventListener('click', async () => {
  try { await api('session', { method: 'DELETE' }); } finally { showLogin('You have been signed out.'); }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = 'Signing in…';
  try {
    await api('login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(loginForm))) });
    await openDashboard();
  } catch (error) { byId('login-message').textContent = error.message; }
  finally { button.disabled = false; button.textContent = 'Sign in'; }
});

async function openDashboard() {
  const response = await fetch('/data/site-content.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load website content.');
  siteContent = await response.json();
  loginView.hidden = true; adminView.hidden = false;
  fillBusiness(); renderServices();
}

(async function init() {
  try {
    const session = await api('session');
    if (session.authenticated) await openDashboard();
  } catch (error) { byId('login-message').textContent = error.message; }
})();
