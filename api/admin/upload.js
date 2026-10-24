const { randomUUID } = require('node:crypto');
const { requireAdmin, githubConfig, githubRequest } = require('../../server/admin');

const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!requireAdmin(req, res)) return;
  const { image, mimeType } = req.body || {};
  const extension = types[mimeType];
  if (!extension || typeof image !== 'string' || !image || image.length > 3_750_000) {
    return res.status(400).json({ error: 'Choose a JPG, PNG, WebP or AVIF image smaller than 2.7 MB.' });
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(image)) return res.status(400).json({ error: 'The image data is invalid.' });
  try {
    const bytes = Buffer.from(image, 'base64');
    const isJpeg = mimeType === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = mimeType === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp = mimeType === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    const isAvif = mimeType === 'image/avif' && bytes.toString('ascii', 4, 8) === 'ftyp' && /^(avif|avis)$/.test(bytes.toString('ascii', 8, 12));
    if (!(isJpeg || isPng || isWebp || isAvif)) return res.status(400).json({ error: 'The file does not match its selected image type.' });
    const { branch } = githubConfig();
    const filename = `service-${randomUUID()}.${extension}`;
    const path = `/contents/website/uploads/${filename}`;
    await githubRequest(path, {
      method: 'PUT',
      body: JSON.stringify({ message: 'Upload service image from admin panel', content: image, branch })
    });
    return res.status(200).json({ ok: true, image: `/uploads/${filename}` });
  } catch (error) {
    return res.status(error.status && error.status < 500 ? error.status : 400).json({ error: error.message || 'Could not upload the image.' });
  }
};
