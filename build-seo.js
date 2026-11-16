/* Génère les pages statiques (une par URL), sitemap.xml et robots.txt.
   Usage : node build-seo.js            (GitHub Pages)
           node build-seo.js https://www.medibaf.com   (domaine personnalisé)
   À relancer après chaque modification du catalogue, puis republier tout le dossier. */
const fs = require('fs'), path = require('path');
const SITE = (process.argv[2] || 'https://lewisbaf.github.io/jensen').replace(/\/$/, '');
const src = fs.readFileSync(__dirname + '/script.js', 'utf8');
const { CATS, PRODUCTS } = new Function(src.slice(src.indexOf('const ICONS'), src.indexOf('const REVIEWS')) + ';return { CATS, PRODUCTS };')();
const slugify = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fmt = n => n.toLocaleString('fr-FR') + ' FCFA';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const abs = p => SITE + (p === '/' ? '/' : p + '/');
const B = ' | MEDIBAF';
const tpl = fs.readFileSync(__dirname + '/index.html', 'utf8');
const sub = (h, re, v) => h.replace(re, (m, a) => a + v);

function page(file, { title, desc, path: p, noindex, h1, body, ld }) {
  let h = tpl.replace(/<title>.*?<\/title>/, () => `<title>${esc(title)}</title>`);
  h = sub(h, /(<meta name="description" content=")[^"]*/, esc(desc));
  h = sub(h, /(<meta name="robots" content=")[^"]*/, noindex ? 'noindex,follow' : 'index,follow');
  h = sub(h, /(<link rel="canonical" href=")[^"]*/, abs(p));
  h = sub(h, /(<link rel="alternate" hreflang="fr-CG" href=")[^"]*/, abs(p));
  h = sub(h, /(<meta property="og:title" content=")[^"]*/, esc(title));
  h = sub(h, /(<meta property="og:description" content=")[^"]*/, esc(desc));
  h = sub(h, /(<meta property="og:url" content=")[^"]*/, abs(p));
  if (ld) h = h.replace('</head>', () => `<script type="application/ld+json" id="ld-page">${JSON.stringify(ld)}</script>\n</head>`);
  h = h.replace(/<main id="app" tabindex="-1">[\s\S]*?<\/main>/, () => `<main id="app" tabindex="-1"><div class="wrap page"><h1>${esc(h1)}</h1>${body}</div></main>`);
  fs.mkdirSync(path.dirname(path.join(__dirname, file)), { recursive: true });
  fs.writeFileSync(path.join(__dirname, file), h);
}

const urls = [['/', 1.0]];
const add = (dir, u, pr, o) => { page(dir + '/index.html', { path: u, ...o }); urls.push([u, pr]); };
add('catalogue', '/catalogue', 0.9, { title: 'Catalogue de matériel médical en ligne' + B, desc: 'Tous les produits médicaux et paramédicaux de MEDIBAF : diagnostic, consommables, premiers secours, hygiène et mobilier. Prix en FCFA.', h1: 'Catalogue de matériel médical', body: '<p>' + CATS.map(c => `<a href="catalogue/${c.id}/">${esc(c.name)}</a>`).join(' | ') + '</p>' });
CATS.forEach(c => add('catalogue/' + c.id, '/catalogue/' + c.id, 0.8, { title: c.name + ' en ligne à Brazzaville' + B, desc: `Découvrez notre sélection de ${c.name.toLowerCase()} : prix en FCFA, disponibilité et livraison à Brazzaville.`, h1: c.name,
  body: '<ul>' + PRODUCTS.filter(p => p.cat === c.id).map(p => `<li><a href="produit/${p.id}-${slugify(p.name)}/">${esc(p.name)}</a> : ${fmt(p.price)}</li>`).join('') + '</ul>' }));
PRODUCTS.forEach(p => { const slug = p.id + '-' + slugify(p.name), c = CATS.find(x => x.id === p.cat);
  add('produit/' + slug, '/produit/' + slug, 0.7, { title: `${p.name} : prix en FCFA${B}`, desc: `${p.name} à ${fmt(p.price).replace(' FCFA', ' FCFA')}. ${p.desc}`.slice(0, 155), h1: p.name,
    body: `<p>${esc(p.desc)}</p><p>${fmt(p.price)} : ${p.stock > 0 ? 'en stock' : 'indisponible'}</p><p><a href="catalogue/${c.id}/">${esc(c.name)}</a></p>`,
    ld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Product', name: p.name, description: p.desc, sku: String(p.id), category: c.name, ...(p.image ? { image: SITE + '/' + p.image } : {}),
        offers: { '@type': 'Offer', url: abs('/produit/' + slug), priceCurrency: 'XAF', price: p.price, availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: c.name, item: abs('/catalogue/' + c.id) }, { '@type': 'ListItem', position: 3, name: p.name }] }] } }); });
add('a-propos', '/a-propos', 0.4, { title: 'À propos de MEDIBAF | Équipements médicaux au Congo', desc: "MEDIBAF facilite l'accès aux équipements et produits médicaux et paramédicaux en République du Congo.", h1: 'À propos de MEDIBAF', body: '<p>MEDIBAF est une boutique en ligne de matériel et de produits médicaux et paramédicaux.</p>' });
add('contact', '/contact', 0.4, { title: 'Contact MEDIBAF | Brazzaville, Congo', desc: 'Contactez MEDIBAF par téléphone, e-mail ou WhatsApp pour vos commandes de matériel médical à Brazzaville.', h1: 'Contact', body: '<p>Brazzaville, République du Congo.</p>' });
page('404.html', { title: 'Page introuvable' + B, desc: 'Cette page n\'existe pas.', path: '/', noindex: true, h1: 'Page introuvable', body: '<p><a href="catalogue/">Voir le catalogue</a></p>' });

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(__dirname + '/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(([u, pr]) => `  <url><loc>${abs(u)}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync(__dirname + '/robots.txt', `User-agent: *\nAllow: /\nDisallow: /panier\nDisallow: /commande\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(urls.length + ' URL, pages générées pour ' + SITE);
