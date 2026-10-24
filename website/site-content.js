(() => {
  const onServicePath = location.pathname.startsWith('/services/');
  const prefix = onServicePath ? '../' : '/';
  const normalizePath = (value) => value.replace(/\.html$/i, '').replace(/\/$/, '') || '/';

  function setText(node, value) {
    node.replaceChildren(document.createTextNode(value));
  }

  function setBrand(node, value) {
    const words = value.trim().split(/\s+/);
    const first = words.slice(0, Math.min(2, words.length)).join(' ');
    node.replaceChildren(document.createTextNode(first));
    if (words.length > 2) {
      node.append(document.createTextNode(' '));
      const highlight = document.createElement('span');
      highlight.textContent = words.slice(2).join(' ');
      node.append(highlight);
    }
  }

  function applyContact(business) {
    document.title = document.title.replace(/N dee tour and travel/gi, business.name);
    document.querySelectorAll('.logo-text').forEach((node) => setBrand(node, business.name));
    const homeHeading = document.querySelector('#home h1');
    if (homeHeading) setBrand(homeHeading, business.name);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        return parent && !['SCRIPT', 'STYLE'].includes(parent.tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    while (walker.nextNode()) walker.currentNode.nodeValue = walker.currentNode.nodeValue.replace(/N dee tour and travel/gi, business.name);
    document.querySelectorAll('meta[content]').forEach((meta) => {
      meta.content = meta.content.replace(/N dee tour and travel/gi, business.name);
    });
    const digits = business.phone.replace(/\D/g, '');
    const whatsapp = business.whatsapp.replace(/\D/g, '');
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      const text = link.textContent.trim();
      link.href = `tel:+${digits}`;
      if (/\+?\d[\d\s().-]{7,}/.test(text)) setText(link, business.phone);
    });
    document.querySelectorAll('a[href*="wa.me/"]').forEach((link) => {
      const query = new URLSearchParams({ text: `Hello ${business.name}, I would like to enquire about your taxi and travel services.` });
      link.href = `https://wa.me/${whatsapp}?${query}`;
    });
    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      link.href = `mailto:${business.email}`;
      if (link.textContent.trim().includes('@')) setText(link, business.email);
    });
    document.querySelectorAll('[data-business-address]').forEach((node) => setText(node, business.address));
    document.querySelectorAll('a[href*="destination="]').forEach((link) => {
      const url = new URL(link.href);
      url.searchParams.set('destination', business.address);
      link.href = url.toString();
    });
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const schema = JSON.parse(script.textContent);
        if (schema['@type'] === 'LocalBusiness') {
          schema.name = business.name;
          schema.telephone = business.phone;
          schema.email = business.email;
          schema.address.streetAddress = business.address;
          script.textContent = JSON.stringify(schema);
        }
      } catch {}
    });
  }

  function serviceLink(service) {
    if (service.url) return service.url;
    return `/service.html?id=${encodeURIComponent(service.id)}`;
  }

  function renderServiceCards(services) {
    const grid = document.querySelector('#services .services-grid');
    if (!grid) return;
    const visible = services.filter((service) => service.active !== false);
    grid.replaceChildren();
    visible.forEach((service) => {
      const card = document.createElement('article');
      card.className = 'service-card reveal';
      if (service.image) {
        const img = document.createElement('img');
        img.className = 'service-card-image'; img.src = service.image; img.alt = service.name; img.loading = 'lazy';
        card.classList.add('has-image'); card.append(img);
      } else {
        const icon = document.createElement('div'); icon.className = 'service-icon-fallback'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = 'ND'; card.append(icon);
      }
      const title = document.createElement('h3'); title.textContent = service.name;
      const summary = document.createElement('p'); summary.textContent = service.summary;
      const link = document.createElement('a'); link.className = 'btn-enquire'; link.href = serviceLink(service); link.textContent = 'View service →';
      card.append(title, summary, link); grid.append(card);
    });
  }

  function applyServicePage(services) {
    const path = normalizePath(location.pathname);
    const service = services.find((item) => item.url && normalizePath(new URL(item.url, location.origin).pathname) === path);
    if (!service) return;
    const hero = document.querySelector('.page-hero');
    if (!hero) return;
    const title = hero.querySelector('h1');
    const summary = hero.querySelector(':scope > p');
    if (title) setText(title, service.name);
    if (summary) setText(summary, service.summary);
    const content = document.querySelector('.content-grid > div > p');
    if (content) setText(content, service.details || service.summary);
    if (service.image) {
      const image = document.createElement('img');
      image.className = 'admin-service-image'; image.src = service.image; image.alt = service.name; image.loading = 'lazy';
      Object.assign(image.style, { display: 'block', width: 'min(100%, 620px)', maxHeight: '280px', objectFit: 'cover', borderRadius: '14px', margin: '0 auto 24px' });
      hero.prepend(image);
    }
  }

  fetch(`${prefix}data/site-content.json`, { cache: 'no-cache' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Website content is unavailable.')))
    .then((content) => {
      if (content.business) applyContact(content.business);
      if (Array.isArray(content.services)) {
        renderServiceCards(content.services);
        if (onServicePath) applyServicePage(content.services);
      }
    })
    .catch(() => {});
})();
