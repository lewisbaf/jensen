/* MEDIBAF - logique front-end (routage par hash, panier, filtres, commande).
   Architecture : les données passent par l'objet Store. Pour brancher une base de données
   ou un paiement plus tard, remplacer Store.getProducts() et Store.saveOrder() par des appels API. */
'use strict';

/* ---------- Configuration à renseigner ---------- */
const CONFIG = {
  phone: '+242 00 000 0000',          // À REMPLACER
  email: 'contact@medibaf.com',       // À REMPLACER
  whatsapp: '242000000000',           // Format international sans "+" - À REMPLACER
  address: 'Brazzaville, République du Congo',
  currency: 'FCFA'
};
const DELIVERY = [
  { id: 'domicile', label: 'Livraison à domicile', fee: 2000 },   // Tarifs à confirmer
  { id: 'retrait', label: 'Retrait en boutique', fee: 0 }
];

/* ---------- Données ---------- */
const ICONS = {
  materiel: '<path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',
  diagnostic: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  consommables: '<path d="M4 20l5-5M14 4l6 6M12 6l6 6-7 7-6-6z"/>',
  secours: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  hygiene: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  mobilier: '<path d="M3 18V7M3 13h18v5M21 13v-2a3 3 0 0 0-3-3h-7v5"/>',
  accessoires: '<circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>'
};
const CATS = [
  { id: 'materiel', name: 'Matériel médical' },
  { id: 'diagnostic', name: 'Équipements de diagnostic' },
  { id: 'consommables', name: 'Consommables médicaux' },
  { id: 'secours', name: 'Premiers secours' },
  { id: 'hygiene', name: 'Hygiène et protection' },
  { id: 'mobilier', name: 'Mobilier médical' },
  { id: 'accessoires', name: 'Accessoires médicaux' }
];
/* Produits d'exemple : prix, stocks et textes sont des PLACEHOLDERS à remplacer par vos données réelles.
   Pour afficher une vraie photo, ajouter le champ image: 'images/nom.jpg'. Champs optionnels : tag, old (ancien prix). */
const PRODUCTS = [
  { id: 1, name: 'Stéthoscope double pavillon', cat: 'materiel', price: 15000, stock: 25, best: 1, desc: 'Stéthoscope à double pavillon pour l\'auscultation cardiaque et pulmonaire, avec olives souples et tube résistant.' },
  { id: 2, name: 'Tensiomètre électronique de bras', cat: 'diagnostic', price: 28000, stock: 12, best: 1, desc: 'Tensiomètre automatique avec brassard ajustable, écran lisible et mémoire des dernières mesures.' },
  { id: 3, name: 'Thermomètre infrarouge frontal', cat: 'diagnostic', price: 12000, stock: 30, new: 1, desc: 'Mesure de la température sans contact en quelques secondes, adaptée aux adultes et aux enfants.' },
  { id: 4, name: 'Oxymètre de pouls', cat: 'diagnostic', price: 14000, stock: 18, best: 1, old: 18000, tag: 'Promo', desc: 'Mesure de la saturation en oxygène et de la fréquence cardiaque au bout du doigt.' },
  { id: 5, name: 'Seringues jetables (boîte de 100)', cat: 'consommables', price: 9000, stock: 40, desc: 'Seringues stériles à usage unique, emballées individuellement.' },
  { id: 6, name: 'Gants d\'examen en nitrile (boîte de 100)', cat: 'consommables', price: 7500, stock: 60, best: 1, desc: 'Gants non poudrés, ambidextres, pour examens et soins courants.' },
  { id: 7, name: 'Trousse de premiers secours', cat: 'secours', price: 20000, stock: 15, new: 1, desc: 'Trousse compacte avec pansements, compresses, bandes et ciseaux pour la maison, le véhicule ou le bureau.' },
  { id: 8, name: 'Couverture de survie', cat: 'secours', price: 1500, stock: 80, desc: 'Couverture isotherme légère, à glisser dans toute trousse ou sac.' },
  { id: 9, name: 'Masques chirurgicaux (boîte de 50)', cat: 'hygiene', price: 4000, stock: 100, best: 1, old: 5000, tag: 'Promo', desc: 'Masques à trois couches avec barrette nasale et élastiques confortables.' },
  { id: 10, name: 'Gel hydroalcoolique 500 ml', cat: 'hygiene', price: 3500, stock: 0, desc: 'Solution pour l\'hygiène des mains, avec flacon pompe.' },
  { id: 11, name: 'Lit d\'examen médical', cat: 'mobilier', price: 120000, stock: 4, new: 1, desc: 'Table d\'examen rembourrée avec revêtement lavable et structure métallique stable.' },
  { id: 12, name: 'Chariot de soins à tiroirs', cat: 'mobilier', price: 85000, stock: 6, desc: 'Chariot mobile à roulettes avec plateau et tiroirs pour ranger le matériel de soin.' },
  { id: 13, name: 'Marteau à réflexes', cat: 'accessoires', price: 5000, stock: 20, desc: 'Marteau de percussion pour l\'examen neurologique, manche ergonomique.' },
  { id: 14, name: 'Lampe d\'examen portable', cat: 'accessoires', price: 6500, stock: 22, new: 1, desc: 'Lampe stylo à LED, faisceau précis pour l\'examen de la gorge et des pupilles.' }
];
const REVIEWS = []; // Ajouter ici uniquement de vrais avis clients : { name, text }

const Store = {
  getProducts: () => PRODUCTS,
  saveOrder(order) { const o = JSON.parse(localStorage.getItem('medibaf_orders') || '[]'); o.push(order); localStorage.setItem('medibaf_orders', JSON.stringify(o)); }
};

/* ---------- Utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => n.toLocaleString('fr-FR') + ' ' + CONFIG.currency;
const byId = id => Store.getProducts().find(p => p.id === +id);
const catName = id => CATS.find(c => c.id === id).name;
const slugify = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const purl = p => 'produit/' + p.id + '-' + slugify(p.name);
const icon = (id, s = 24) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id]}</svg>`;
const thumb = p => `<div class="thumb">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : icon(p.cat, 64)}${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}</div>`;

function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 2800);
}

/* ---------- Panier (LocalStorage) ---------- */
let cart = [];
try { cart = JSON.parse(localStorage.getItem('medibaf_cart') || '[]'); } catch (e) { cart = []; }
const saveCart = () => { try { localStorage.setItem('medibaf_cart', JSON.stringify(cart)); } catch (e) {} $('#cartCount').textContent = cart.reduce((a, l) => a + l.qty, 0); };
const subtotal = () => cart.reduce((a, l) => a + byId(l.id).price * l.qty, 0);
function addToCart(id, qty = 1) {
  const p = byId(id); if (!p || p.stock < 1) return;
  const l = cart.find(x => x.id === id);
  if (l) l.qty = Math.min(l.qty + qty, p.stock); else cart.push({ id, qty: Math.min(qty, p.stock) });
  saveCart(); toast(p.name + ' ajouté au panier');
}
function setQty(id, qty) {
  const p = byId(id), l = cart.find(x => x.id === id); if (!l) return;
  l.qty = Math.max(1, Math.min(qty, p.stock)); saveCart(); render();
}
function removeLine(id) { cart = cart.filter(l => l.id !== id); saveCart(); render(); toast('Produit retiré du panier'); }

/* ---------- Cartes ---------- */
const stockLabel = p => p.stock > 0 ? '<span class="stock in">En stock</span>' : '<span class="stock out">Indisponible</span>';
const card = p => `<article class="card"><a href="${purl(p)}" aria-label="${esc(p.name)}">${thumb(p)}</a>
  <div class="body"><span class="cat">${catName(p.cat)}</span><h3><a href="${purl(p)}">${esc(p.name)}</a></h3>
  <div><span class="price">${fmt(p.price)}</span>${p.old ? `<span class="old">${fmt(p.old)}</span>` : ''}</div>${stockLabel(p)}
  <button class="btn" data-add="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>Ajouter au panier</button></div></article>`;

/* ---------- Vues ---------- */
const filters = { q: '', cat: 'all', sort: 'default' };

function viewHome() {
  const P = Store.getProducts();
  const sect = (title, list, cls = '') => `<section class="sec ${cls}"><div class="wrap"><div class="sec-h"><h2>${title}</h2><a href="catalogue">Tout voir</a></div><div class="grid">${list.map(card).join('')}</div></div></section>`;
  return `<section class="hero"><div class="wrap"><div>
      <h1>Le matériel médical dont vous avez besoin, livré chez vous.</h1>
      <p>Équipements de diagnostic, consommables, mobilier et produits de protection pour les professionnels de santé et les particuliers.</p>
      <div class="acts"><a class="btn sky" href="catalogue">Voir le catalogue</a><a class="btn alt" href="contact">Nous contacter</a></div></div>
      <div class="tiles">${CATS.slice(0, 6).map(c => `<a class="tile" href="catalogue/${c.id}">${icon(c.id, 28)}${c.name}</a>`).join('')}</div></div></section>
    <div class="assure wrap"><div><b>Prix en FCFA</b>Affichés clairement sur chaque produit.</div><div><b>Livraison</b>À domicile ou retrait en boutique.</div><div><b>Assistance WhatsApp</b>Posez vos questions avant de commander.</div></div>
    <section class="sec"><div class="wrap"><h2>Catégories populaires</h2><div class="grid">${CATS.map(c => `<a class="tile" style="background:var(--ice);border-color:var(--line);color:var(--navy)" href="catalogue/${c.id}">${icon(c.id, 28)}${c.name}</a>`).join('')}</div></div></section>
    ${sect('Les plus vendus', P.filter(p => p.best), 'tint')}${sect('Nouveautés', P.filter(p => p.new))}${sect('Promotions', P.filter(p => p.old), 'tint')}
    <section class="sec"><div class="wrap"><h2>Avis des clients</h2>${REVIEWS.length
      ? `<div class="grid">${REVIEWS.map(r => `<blockquote class="card body"><p>${esc(r.text)}</p><b>${esc(r.name)}</b></blockquote>`).join('')}</div>`
      : '<div class="empty">Les avis de nos clients seront publiés ici après leurs premières commandes.</div>'}</div></section>`;
}

function viewCatalog(catParam) {
  filters.cat = CATS.some(c => c.id === catParam) ? catParam : 'all';
  let list = Store.getProducts().filter(p => (filters.cat === 'all' || p.cat === filters.cat) &&
    (p.name + ' ' + p.desc + ' ' + catName(p.cat)).toLowerCase().includes(filters.q.toLowerCase()));
  if (filters.sort === 'asc') list.sort((a, b) => a.price - b.price);
  if (filters.sort === 'desc') list.sort((a, b) => b.price - a.price);
  return `<section class="sec"><div class="wrap"><h1 style="font-size:2rem;margin-bottom:1.5rem">${filters.cat === 'all' ? 'Catalogue de matériel médical' : catName(filters.cat)}</h1>
    <div class="tools"><button class="chip ${filters.cat === 'all' ? 'on' : ''}" data-cat="all">Tous</button>
    ${CATS.map(c => `<button class="chip ${filters.cat === c.id ? 'on' : ''}" data-cat="${c.id}">${c.name}</button>`).join('')}
    <label class="sr" for="sort">Trier</label><select id="sort"><option value="default">Trier par</option><option value="asc" ${filters.sort === 'asc' ? 'selected' : ''}>Prix croissant</option><option value="desc" ${filters.sort === 'desc' ? 'selected' : ''}>Prix décroissant</option></select></div>
    ${filters.q ? `<p style="margin-bottom:1rem">${list.length} résultat(s) pour « ${esc(filters.q)} »</p>` : ''}
    ${list.length ? `<div class="grid">${list.map(card).join('')}</div>`
      : '<div class="empty">Aucun produit ne correspond à votre recherche.<br><button class="btn alt" data-reset>Réinitialiser les filtres</button></div>'}</div></section>`;
}

function viewProduct(id) {
  const p = byId(id); if (!p) return viewNotFound();
  const sim = Store.getProducts().filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  return `<div class="wrap"><nav class="crumbs"><a href="./">Accueil</a> / <a href="catalogue/${p.cat}">${catName(p.cat)}</a> / ${esc(p.name)}</nav>
    <div class="detail">${thumb(p)}<div><span class="cat">${catName(p.cat)}</span><h1>${esc(p.name)}</h1>
    <div class="price">${fmt(p.price)}${p.old ? `<span class="old">${fmt(p.old)}</span>` : ''}</div>${stockLabel(p)}
    <p style="margin-top:1rem">${esc(p.desc)}</p>
    <div class="buy"><div class="qty"><button data-d="-1" aria-label="Diminuer">−</button><span id="dq">1</span><button data-d="1" aria-label="Augmenter">+</button></div>
    <button class="btn" data-addq="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>Ajouter au panier</button></div></div></div>
    ${sim.length ? `<h2>Produits similaires</h2><div class="grid" style="padding-bottom:3rem">${sim.map(card).join('')}</div>` : ''}</div>`;
}

function viewCart() {
  if (!cart.length) return `<div class="wrap page"><h2>Votre panier</h2><div class="empty">Votre panier est vide.<br><a class="btn" href="catalogue" style="margin-top:1rem">Parcourir le catalogue</a></div></div>`;
  return `<div class="wrap"><div class="two"><div><h2>Votre panier</h2>${cart.map(l => { const p = byId(l.id); return `<div class="line">${thumb(p)}
    <div><h3><a href="${purl(p)}">${esc(p.name)}</a></h3><span class="cat">${fmt(p.price)} l'unité</span><br><button class="rm" data-rm="${p.id}">Retirer</button></div>
    <div style="text-align:right"><div class="qty"><button data-q="${p.id}" data-d="-1" aria-label="Diminuer">−</button><span>${l.qty}</span><button data-q="${p.id}" data-d="1" aria-label="Augmenter">+</button></div><div class="price" style="margin-top:.4rem">${fmt(p.price * l.qty)}</div></div></div>`; }).join('')}</div>
    <aside class="sum"><h3>Récapitulatif</h3><div class="row"><span>Sous-total</span><span>${fmt(subtotal())}</span></div><div class="row"><span>Livraison</span><span>Calculée à l'étape suivante</span></div>
    <div class="row t"><span>Total</span><span>${fmt(subtotal())}</span></div><a class="btn sky" href="commande">Passer la commande</a></aside></div></div>`;
}

function viewCheckout() {
  if (!cart.length) { history.replaceState(null, '', 'panier'); return viewCart(); }
  const fld = (id, label, type = 'text', req = true) => `<div class="f"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" ${req ? 'required' : ''}><span class="err" id="e-${id}"></span></div>`;
  return `<div class="wrap"><div class="two"><form class="form" id="orderForm" novalidate><h2>Informations de livraison</h2>
    <div class="cols">${fld('nom', 'Nom')}${fld('prenom', 'Prénom')}</div>${fld('tel', 'Téléphone', 'tel')}
    <div class="f"><label for="adresse">Adresse de livraison</label><textarea id="adresse" rows="3" required></textarea><span class="err" id="e-adresse"></span></div>
    <fieldset style="border:0;display:grid;gap:.6rem"><legend style="font-weight:700;margin-bottom:.4rem">Mode de livraison</legend>
    ${DELIVERY.map((d, i) => `<label class="opt"><input type="radio" name="mode" value="${d.id}" ${i ? '' : 'checked'}> <span>${d.label} <small>(${d.fee ? fmt(d.fee) : 'gratuit'})</small></span></label>`).join('')}</fieldset>
    <button class="btn sky" type="submit">Confirmer la commande</button></form>
    <aside class="sum"><h3>Votre commande</h3>${cart.map(l => `<div class="row"><span>${esc(byId(l.id).name)} × ${l.qty}</span><span>${fmt(byId(l.id).price * l.qty)}</span></div>`).join('')}
    <div class="row"><span>Livraison</span><span id="shipFee">${fmt(DELIVERY[0].fee)}</span></div><div class="row t"><span>Total</span><span id="grand">${fmt(subtotal() + DELIVERY[0].fee)}</span></div></aside></div></div>`;
}

function viewAbout() {
  return `<div class="wrap page"><h1 style="font-size:2.4rem;margin-bottom:1rem">À propos de MEDIBAF</h1>
    <p>MEDIBAF est une boutique en ligne de matériel et de produits médicaux et paramédicaux. Notre mission est de faciliter l'accès à des équipements fiables, pour les professionnels de santé comme pour les particuliers.</p>
    <div class="vals"><div><h3>Accessibilité</h3><p>Un catalogue clair, des prix affichés en FCFA et une commande simple.</p></div>
    <div><h3>Fiabilité</h3><p>Des informations précises sur chaque produit et sur sa disponibilité.</p></div>
    <div><h3>Service</h3><p>Une équipe joignable par téléphone, e-mail et WhatsApp.</p></div></div></div>`;
}

function viewContact() {
  return `<div class="wrap page"><h1 style="font-size:2.4rem;margin-bottom:2rem">Contact</h1><div class="two" style="padding:0;gap:3rem">
    <form class="form" id="contactForm" novalidate>${['c-nom|Nom|text', 'c-mail|E-mail|email'].map(s => { const [i, l, t] = s.split('|'); return `<div class="f"><label for="${i}">${l}</label><input id="${i}" type="${t}" required><span class="err" id="e-${i}"></span></div>`; }).join('')}
    <div class="f"><label for="c-msg">Message</label><textarea id="c-msg" rows="5" required></textarea><span class="err" id="e-c-msg"></span></div><button class="btn" type="submit">Envoyer le message</button></form>
    <div class="info"><p><b>Téléphone</b><br>${CONFIG.phone}</p><p><b>E-mail</b><br>${CONFIG.email}</p><p><b>Localisation</b><br>${CONFIG.address}</p>
    <a class="btn sky" target="_blank" rel="noopener" href="https://wa.me/${CONFIG.whatsapp}">Écrire sur WhatsApp</a></div></div></div>`;
}

/* ---------- Routage (History API) et SEO ---------- */
const SITE = 'https://lewisbaf.github.io/jensen'; // Avec un domaine personnalisé : 'https://www.medibaf.com' (et <base href="/"> dans index.html)
const BASE = new URL(document.baseURI).pathname.replace(/\/$/, ''); // '/jensen' sur GitHub Pages
const abs = p => SITE + (p === '/' ? '/' : p + '/');
const go = path => { history.pushState(null, '', path); render(); };
const viewNotFound = () => '<div class="wrap page"><h1>Page introuvable</h1><p style="margin:1rem 0">Cette page n\'existe pas ou a été déplacée.</p><a class="btn" href="catalogue">Voir le catalogue</a></div>';

function setMeta(attr, key, val) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', val);
}
function seo({ title, desc, path, noindex, ld }) {
  document.title = title;
  setMeta('name', 'description', desc); setMeta('name', 'robots', noindex ? 'noindex,follow' : 'index,follow');
  setMeta('property', 'og:title', title); setMeta('property', 'og:description', desc); setMeta('property', 'og:url', abs(path));
  let c = document.head.querySelector('link[rel=canonical]');
  if (!c) { c = document.createElement('link'); c.rel = 'canonical'; document.head.appendChild(c); }
  c.href = abs(path);
  const old = $('#ld-page'); if (old) old.remove();
  if (ld) { const j = document.createElement('script'); j.type = 'application/ld+json'; j.id = 'ld-page'; j.textContent = JSON.stringify(ld); document.head.appendChild(j); }
}
/* Titre, description, canonique et données structurées de chaque page */
function pageSeo(route, arg) {
  const B = ' | MEDIBAF';
  if (route === '') return seo({ title: 'MEDIBAF | Matériel médical et paramédical à Brazzaville, Congo', desc: 'Achetez en ligne du matériel médical, tensiomètres, thermomètres, consommables et produits d\'hygiène. Prix en FCFA et livraison à Brazzaville.', path: '/' });
  if (route === 'catalogue') {
    const cat = CATS.find(c => c.id === arg);
    return seo({ title: (cat ? cat.name + ' en ligne à Brazzaville' : 'Catalogue de matériel médical en ligne') + B,
      desc: cat ? `Découvrez notre sélection de ${cat.name.toLowerCase()} : prix en FCFA, disponibilité et livraison à Brazzaville.` : 'Tous les produits médicaux et paramédicaux de MEDIBAF : diagnostic, consommables, premiers secours, hygiène et mobilier. Prix en FCFA.',
      path: cat ? '/catalogue/' + cat.id : '/catalogue', noindex: !!filters.q });
  }
  if (route === 'produit') {
    const p = byId(parseInt(arg));
    if (p) return seo({ title: `${p.name} : prix en FCFA${B}`, desc: `${p.name} à ${fmt(p.price)}. ${p.desc}`.slice(0, 155), path: '/' + purl(p),
      ld: { '@context': 'https://schema.org', '@graph': [
        { '@type': 'Product', name: p.name, description: p.desc, sku: String(p.id), category: catName(p.cat), ...(p.image ? { image: SITE + '/' + p.image } : {}),
          offers: { '@type': 'Offer', url: abs('/' + purl(p)), priceCurrency: 'XAF', price: p.price, availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } },
        { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: catName(p.cat), item: abs('/catalogue/' + p.cat) }, { '@type': 'ListItem', position: 3, name: p.name }] }] } });
  }
  if (route === 'a-propos') return seo({ title: 'À propos de MEDIBAF | Équipements médicaux au Congo', desc: 'MEDIBAF facilite l\'accès aux équipements et produits médicaux et paramédicaux en République du Congo.', path: '/a-propos' });
  if (route === 'contact') return seo({ title: 'Contact MEDIBAF | Brazzaville, Congo', desc: 'Contactez MEDIBAF par téléphone, e-mail ou WhatsApp pour vos commandes de matériel médical à Brazzaville.', path: '/contact' });
  seo({ title: (route === 'panier' ? 'Panier' : route === 'commande' ? 'Commande' : 'Page introuvable') + B, desc: 'MEDIBAF, matériel médical et paramédical.', path: '/' + route, noindex: true });
}

function render() {
  const [route = '', arg] = location.pathname.slice(BASE.length).replace(/^\/|\/$/g, '').split('/');
  const views = { '': viewHome, catalogue: () => viewCatalog(arg), produit: () => viewProduct(parseInt(arg)), panier: viewCart, commande: viewCheckout, 'a-propos': viewAbout, contact: viewContact };
  const known = Object.prototype.hasOwnProperty.call(views, route);
  $('#app').innerHTML = (known ? views[route] : viewNotFound)();
  if (route === 'produit') { const p = byId(parseInt(arg)); if (p && location.pathname.replace(/\/$/, '') !== BASE + '/' + purl(p)) history.replaceState(null, '', purl(p)); }
  pageSeo(known ? route : '404', arg);
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === (route || './')));
  $('#nav').classList.remove('open'); $('#burger').setAttribute('aria-expanded', 'false');
  window.scrollTo(0, 0);
}

/* ---------- Validation ---------- */
function check(form, rules) {
  let ok = true;
  rules.forEach(([id, test, msg]) => {
    const el = $('#' + id), bad = !test(el.value.trim());
    $('#e-' + id).textContent = bad ? msg : ''; el.closest('.f').classList.toggle('bad', bad); if (bad) ok = false;
  });
  return ok;
}

/* ---------- Événements ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('button,[data-add]'); if (!t) return;
  if (t.dataset.add) { addToCart(+t.dataset.add); }
  else if (t.dataset.addq) { addToCart(+t.dataset.addq, +$('#dq').textContent); }
  else if (t.dataset.q) { const l = cart.find(x => x.id === +t.dataset.q); setQty(l.id, l.qty + +t.dataset.d); }
  else if (t.dataset.rm) { removeLine(+t.dataset.rm); }
  else if (t.dataset.d && $('#dq')) { $('#dq').textContent = Math.max(1, +$('#dq').textContent + +t.dataset.d); }
  else if (t.dataset.cat) { go(t.dataset.cat === 'all' ? 'catalogue' : 'catalogue/' + t.dataset.cat); }
  else if (t.hasAttribute('data-reset')) { filters.q = ''; filters.cat = 'all'; filters.sort = 'default'; $('#q').value = ''; go('catalogue'); }
});

document.addEventListener('change', e => {
  if (e.target.id === 'sort') { filters.sort = e.target.value; render(); }
  if (e.target.name === 'mode') { const d = DELIVERY.find(x => x.id === e.target.value); $('#shipFee').textContent = d.fee ? fmt(d.fee) : 'Gratuit'; $('#grand').textContent = fmt(subtotal() + d.fee); }
});

document.addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'orderForm') {
    const ok = check(e.target, [['nom', v => v.length > 1, 'Saisissez votre nom.'], ['prenom', v => v.length > 1, 'Saisissez votre prénom.'],
      ['tel', v => /^[+\d\s().-]{8,}$/.test(v), 'Saisissez un numéro de téléphone valide.'], ['adresse', v => v.length > 5, 'Saisissez votre adresse de livraison.']]);
    if (!ok) return;
    const d = DELIVERY.find(x => x.id === e.target.mode.value), ref = 'MB-' + Date.now().toString(36).toUpperCase();
    Store.saveOrder({ ref, date: new Date().toISOString(), customer: { nom: $('#nom').value, prenom: $('#prenom').value, tel: $('#tel').value, adresse: $('#adresse').value }, delivery: d.id, lines: cart, total: subtotal() + d.fee });
    const total = subtotal() + d.fee; cart = []; saveCart();
    $('#app').innerHTML = `<div class="wrap"><div class="done"><h2>Commande enregistrée</h2><p>Référence : <b>${ref}</b>. Montant total : <b>${fmt(total)}</b>. Nous vous contacterons par téléphone pour confirmer la livraison.</p><a class="btn" href="catalogue">Continuer mes achats</a></div></div>`;
    window.scrollTo(0, 0);
  }
  if (e.target.id === 'contactForm') {
    if (!check(e.target, [['c-nom', v => v.length > 1, 'Saisissez votre nom.'], ['c-mail', v => /^\S+@\S+\.\S+$/.test(v), 'Saisissez une adresse e-mail valide.'], ['c-msg', v => v.length > 4, 'Saisissez votre message.']])) return;
    e.target.reset(); toast('Message prêt à être envoyé. Branchez un service d\'envoi pour l\'activer.');
  }
  if (e.target.id === 'searchForm') { filters.q = $('#q').value.trim(); filters.cat = 'all'; location.pathname.replace(/\/$/, '') === BASE + '/catalogue' ? render() : go('catalogue'); }
});

$('#burger').addEventListener('click', () => { const o = $('#nav').classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o); });
$('#q').addEventListener('input', e => { if (location.pathname.startsWith(BASE + '/catalogue')) { filters.q = e.target.value.trim(); const pos = e.target.selectionStart; render(); e.target.focus(); e.target.setSelectionRange(pos, pos); } });
window.addEventListener('popstate', render);
/* Liens internes : navigation sans rechargement */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target || /^(?:[a-z]+:|#|\/\/)/i.test(a.getAttribute('href'))) return;
  e.preventDefault(); go(a.getAttribute('href'));
});

/* ---------- Démarrage ---------- */
$('#year').textContent = new Date().getFullYear();
$('#footContact').innerHTML = `${esc(CONFIG.phone)}<br>${esc(CONFIG.email)}<br>${esc(CONFIG.address)}`;
saveCart(); render();
