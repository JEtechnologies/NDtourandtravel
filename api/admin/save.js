const { requireAdmin, githubConfig, githubRequest } = require('../../server/admin');

function normalize(input) {
  if (!input || typeof input !== 'object' || !input.business || !Array.isArray(input.services)) throw new Error('The content format is invalid.');
  const cleanText = (value, max, label, required = false) => {
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`${label} is missing or too long.`);
    return value.trim();
  };
  const phone = cleanText(input.business.phone, 40, 'Phone number', true).replace(/[^\d+]/g, '');
  if (phone.replace(/\D/g, '').length < 7) throw new Error('Enter a valid mobile number.');
  const whatsapp = cleanText(input.business.whatsapp, 20, 'WhatsApp number', true).replace(/\D/g, '');
  if (whatsapp.length < 8) throw new Error('Enter a valid WhatsApp number with country code.');
  const email = cleanText(input.business.email || '', 160, 'Email');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  const business = {
    name: cleanText(input.business.name, 100, 'Business name', true),
    address: cleanText(input.business.address, 240, 'Address', true),
    phone,
    whatsapp,
    email
  };
  const ids = new Set();
  const services = input.services.map((service) => {
    const id = cleanText(service.id, 60, 'Service ID', true).toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (ids.has(id)) throw new Error('Service IDs must be unique.');
    ids.add(id);
    const image = cleanText(service.image || '', 300, 'Image path');
    if (image && !/^\/uploads\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp|avif)$/i.test(image)) throw new Error('A service image path is invalid.');
    const url = cleanText(service.url || '', 300, 'Service link');
    if (url && ((!url.startsWith('/') || url.startsWith('//')) && !/^https:\/\//i.test(url))) throw new Error('Service links must be site paths or HTTPS URLs.');
    return {
      id,
      name: cleanText(service.name, 100, 'Service name', true),
      summary: cleanText(service.summary, 300, 'Service summary', true),
      details: cleanText(service.details || service.summary, 3000, 'Service details', true),
      image,
      url,
      active: service.active !== false
    };
  });
  if (services.length > 40) throw new Error('You can add up to 40 services.');
  return { business, services };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!requireAdmin(req, res)) return;
  try {
    const content = normalize(req.body);
    const { branch } = githubConfig();
    const path = '/contents/website/data/site-content.json';
    const current = await githubRequest(`${path}?ref=${encodeURIComponent(branch)}`);
    const { token, owner, repo } = githubConfig();
    const body = {
      message: 'Update website content from admin panel',
      content: Buffer.from(`${JSON.stringify(content, null, 2)}\n`).toString('base64'),
      sha: current.sha,
      branch
    };
    const saved = await githubRequest(path, { method: 'PUT', body: JSON.stringify(body) });
    return res.status(200).json({ ok: true, commit: saved.commit.sha, site: `https://github.com/${owner}/${repo}/commit/${saved.commit.sha}` });
  } catch (error) {
    return res.status(error.status && error.status < 500 ? error.status : 400).json({ error: error.message || 'Could not save the changes.' });
  }
};
