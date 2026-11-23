#!/usr/bin/env python3
"""Nawala's reading pages, written from one place (owner, 23 Nov 2026: "more comprehensive explanation like Viding").

Run from the repository root:  python3 tools/halaman.py
It writes layanan/ (an overview and four product pages), faq/, mitra/, kabar/ (index and articles), and refreshes
the blocks between <!-- gen:NAME --> and <!-- /gen:NAME --> in index.html (platform, paket, faq, kabar, footer links).
The site itself has no build step: the written files are committed. Edit the copy here, run this, commit both.
Every visible string is a pair (Indonesian, English); the pages swap them with data-en (assets/js/halaman.js).
Rules that hold here as everywhere: no invented evidence (no customers, testimonials or prices), no emojis,
no all-caps labels, no middle-dot taglines, no arrows inside buttons.
"""
import html, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = '20261123p1'   # bump when halaman.css / halaman.js change

def esc(s): return html.escape(s, quote=True)
def T(p, tag='span', cls='', attrs=''):
    """a bilingual element: Indonesian inside, English in data-en"""
    i, e = p
    c = f' class="{cls}"' if cls else ''
    return f'<{tag}{c}{(" " + attrs) if attrs else ""} data-en="{esc(e)}">{esc(i)}</{tag}>'

# ---------- figures numbers (developer mode: exact; owner, 23 Nov 2026) ----------
# Later the owner will hide exact numbers behind words such as "ratusan"; change MODE to 'kira' and run again.
MODE = 'pasti'
N = {'tema': 122, 'dasar': 84, 'premium': 32, 'eksklusif': 6, 'contoh': 92, 'dunia': 8, 'demo': 3, 'huruf': 43, 'elemen': 38, 'bingkai': 12}
def num(k, kira=('ratusan', 'hundreds')):
    return str(N[k]) if MODE == 'pasti' else kira

# ---------- icons (24 x 24 line drawings, stroke only) ----------
IC = {
 'surat': 'M3 7.5 12 13l9-5.5M4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-9A1.5 1.5 0 0 1 4.5 6Z',
 'nama': 'M4 19.5c1.2-3.2 4.2-5 8-5s6.8 1.8 8 5M12 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z',
 'bagi': 'M8 12h8M12 8v8M4 6.5h4v4H4zM16 13.5h4v4h-4zM4 13.5h4v4H4zM16 6.5h4v4h-4z',
 'kirim': 'm21 3-9.5 9.5M21 3l-6.5 18-3-8.5-8.5-3L21 3Z',
 'hadir': 'm5 12.5 4.5 4.5L19 7.5',
 'ucap': 'M20.5 11.5a8 8 0 0 1-11.6 7.1L4 20l1.3-4.4A8 8 0 1 1 20.5 11.5Z',
 'kado': 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1.5-3.5-5.5-3.5-5.5-1S10 7 12 7Zm0 0c1.5-3.5 5.5-3.5 5.5-1S14 7 12 7Z',
 'kunci': 'M7.5 15.5a4 4 0 1 1 0-.01ZM10.4 12.6 19 4M15.5 7.5 18 10M18 5l2 2',
 'kuas': 'M14.5 4.5 19.5 9.5 10 19l-5.5 1 1-5.5 9-10ZM12.5 6.5l5 5',
 'orang': 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.9-3.2 3.4-5 6.5-5s5.6 1.8 6.5 5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 15c2 .6 3.1 2.2 3.5 4.5',
 'ulang': 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
 'bahasa': 'M4 5h9M8.5 3v2M6 5c.5 4 3 7 6 8.5M11 5c-.8 4-3.4 7.5-7 9.5M13 20l4-9 4 9M14.3 17h5.4',
 'musik': 'M9 18.5V6l11-2v12.5M9 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm11-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
 'kilat': 'M13 2.5 4.5 13.5H11L10 21.5l8.5-11H12l1-8Z',
 'alamat': 'M10 14a4 4 0 0 0 5.7 0l3.6-3.6a4 4 0 0 0-5.7-5.7L12.5 5.8M14 10a4 4 0 0 0-5.7 0l-3.6 3.6a4 4 0 0 0 5.7 5.7l1.1-1.1',
 'qr': 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2zM6.5 6.5h1v1h-1zM16.5 6.5h1v1h-1zM6.5 16.5h1v1h-1z',
 'tablet': 'M6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3ZM10.5 18h3',
 'sinyal': 'M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0M12 19h.01M2 9.5a14.5 14.5 0 0 1 20 0',
 'seragam': 'M8 3.5 12 6l4-2.5 4.5 3-2 4-2-1V20h-9V9.5l-2 1-2-4 4.5-3ZM12 6v14',
 'layar': 'M3.5 5h17v11h-17zM8 20h8M12 16v4',
 'meja': 'M12 14.5a5 2.5 0 1 0 0-5 5 2.5 0 0 0 0 5ZM5 6.5h.01M19 6.5h.01M5 17.5h.01M19 17.5h.01M12 4h.01M12 20h.01',
 'cari': 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
 'souvenir': 'M5 9h14l-1.5 11h-11L5 9ZM9 9V7a3 3 0 0 1 6 0v2',
 'foto': 'M4 7.5h3.5L9 5h6l1.5 2.5H20V19H4V7.5ZM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
 'unduh': 'M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14',
 'kamera': 'M3.5 7h12v10h-12zM15.5 10.5 20.5 7.5v9l-5-3',
 'gerak': 'M3.5 7h9v8h-9zM12.5 10l4-2.5v7l-4-2.5M18 6c1.5 1.5 2.5 3.5 2.5 5s-1 3.5-2.5 5M5 19h6',
 'bingkai': 'M4 4h16v16H4zM7.5 7.5h9v9h-9z',
 'rekam': 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
 'platform': 'M4 5.5h16v10H4zM8 19.5h8M6.5 8.5h2M6.5 11h5',
 'rapat': 'M4 5h16v11H8l-4 4V5ZM8 9.5h8M8 12.5h5',
 'pohon': 'M12 4v4M5 12V8h14v4M5 12v2M12 12V8M19 12v2M3.5 14h3v3h-3zM10.5 14h3v3h-3zM17.5 14h3v3h-3zM10 2.5h4v2.5h-4z',
 'kanban': 'M4 4h4.5v16H4zM9.75 4h4.5v10h-4.5zM15.5 4H20v7h-4.5z',
 'gantt': 'M4 5h8M7 10h10M10 15h9M4 20h16M4 3v18',
 'uang': 'M3.5 7h17v10h-17zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6.5 10v.01M17.5 14v.01',
 'toko': 'M4 9.5 5.5 4h13L20 9.5M4 9.5h16M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 11.5V20h13v-8.5M10 20v-5h4v5',
 'jam': 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM12 7.5V12l3 2',
 'centang': 'M9 11.5 11.5 14 16 9M5 4.5h14v15H5z',
 'berkas': 'M7 3.5h7l4 4v13H7v-17ZM14 3.5v4h4',
 'lonceng': 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0',
 'denah': 'M3.5 5.5 9 3.5l6 2 5.5-2v15l-5.5 2-6-2-5.5 2v-15ZM9 3.5v15M15 5.5v15',
 'tema': 'm12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5ZM3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5',
 'demo': 'M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4',
 'paket': 'M4 8 12 4l8 4v8l-8 4-8-4V8ZM4 8l8 4 8-4M12 12v8',
 'tanya': 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
 'mitra': 'M8 12.5 4.5 9 8 5.5 12 9l4-3.5L19.5 9 16 12.5M8 12.5l4 4 4-4M8 12.5 4.5 16M16 12.5l3.5 3.5',
 'kabar': 'M5 4.5h11v15H6.5A1.5 1.5 0 0 1 5 18V4.5ZM16 8.5h3V18a1.5 1.5 0 0 1-3 0M8 8h5M8 11h5M8 14h3',
 'ruang': 'M4 10.5 12 4l8 6.5V20H4v-9.5ZM9.5 20v-5.5h5V20',
 'wa': 'M20.5 11.5a8 8 0 0 1-11.6 7.1L4 20l1.3-4.4A8 8 0 1 1 20.5 11.5ZM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.5-2.3-1.8-2.8-2.8l.8-1-1-2L9 8.5Z',
 'perisai': 'M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6L12 3Z',
 'telepon': 'M6.5 3.5h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z',
 'label': 'M3.5 12.5V4.5h8l9 9-8 8-9-9ZM8 8.5h.01',
 'undian': 'M4 7.5h16v3a2 2 0 0 0 0 3v3H4v-3a2 2 0 0 0 0-3v-3ZM14.5 7.5v9',
 'mobil': 'M4 15.5V12l2-5h12l2 5v3.5H4ZM4 12h16M7.5 18.5a1.5 1.5 0 1 0 0-.01M16.5 18.5a1.5 1.5 0 1 0 0-.01',
 'selamanya': 'M8 15.5a3.5 3.5 0 1 1 0-7c3 0 5 7 8 7a3.5 3.5 0 1 0 0-7c-3 0-5 7-8 7Z',
 'acara': 'M4.5 6h15v14h-15zM4.5 10h15M8.5 3.5v4M15.5 3.5v4M8 14h3M13 14h3M8 17h3',
 'kuota': 'M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 19.5c.8-2.8 3-4.5 5.5-4.5s4.7 1.7 5.5 4.5M16 11a2.5 2.5 0 1 0 0-5M17 15c2 .4 3.4 2 4 4.5',
 'kota': 'M4 20V9l5-3v14M9 20V4l6 3v13M15 20v-9l5 2v7M3 20h18',
}
def icon(k, cls='ic'): return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="{IC[k]}"/></svg>'
TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'

# ---------- the five products ----------
PRODUCTS = [
 ('undangan-digital', 'surat', ('Undangan digital', 'Digital invitation'), ('Atas nama tiap tamu, dikirim otomatis lewat WhatsApp.', "In each guest's name, sent automatically on WhatsApp.")),
 ('buku-tamu-digital', 'qr', ('Buku tamu digital', 'Digital guestbook'), ('Pindai QR di pintu, layar sapaan, meja, dan souvenir.', 'QR at the door, a greeting screen, tables and souvenirs.')),
 ('rsvp-asisten', 'telepon', ('Asisten RSVP', 'RSVP Assistance'), ('Tim kami menanyakan kehadiran setiap tamu, lewat chat dan telepon.', 'Our team asks every guest whether they are coming, by chat and by phone.')),
 ('live-streaming', 'kamera', ('Live streaming', 'Live streaming'), ('Siaran sinematik untuk yang tidak bisa hadir.', 'A cinematic broadcast for those who cannot come.')),
 ('persiapan', 'kanban', ('Persiapan pernikahan', 'Wedding planning'), ('WBS, kanban, gantt, anggaran, vendor, dan rundown bersama tim.', 'WBS, kanban, gantt, budget, vendors and rundown with our team.')),
]
WA_BOOK = ('Halo Nawala, saya ingin memesan.', 'Hello Nawala, I would like to book.')

def wa_btn(label, msg, cls='btn btn--glow', extra=''):
    return f'<a class="{cls}" href="#" data-wa="{esc(msg[0])}" data-wa-en="{esc(msg[1])}"{extra} data-en="{esc(label[1])}">{esc(label[0])}</a>'

def link_btn(label, href, cls='btn btn--glass', lang=False, new=False):
    a = f' data-langlink="{esc(href)}"' if lang else ''
    n = ' target="_blank" rel="noopener"' if new else ''
    return f'<a class="{cls}" href="{esc(href)}"{a}{n} data-en="{esc(label[1])}">{esc(label[0])}</a>'

# ---------- page frame ----------
def head(B, title, desc, title_en, garis=False, noindex=False):
    g = f'<link rel="stylesheet" href="{B}assets/css/rasa.css?v=10">\n' if garis else ''
    ni = '<meta name="robots" content="noindex">\n' if noindex else ''
    return f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="nawala-title-en" content="{esc(title_en)}">
<meta name="description" content="{esc(desc)}">
{ni}<meta name="theme-color" content="#FBF8F6">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{B}assets/img/og.jpg">
<meta property="og:type" content="website">
<link rel="icon" href="{B}assets/img/icon-64.png" type="image/png">
<link rel="apple-touch-icon" href="{B}assets/img/icon-180.png">
<link rel="preload" href="{B}assets/fonts/jakarta.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{B}assets/fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin>
<script>
(function(){{var d=document.documentElement,q=new URLSearchParams(location.search);
try{{var l=q.get('lang')||localStorage.getItem('nawala-lang');if(l==='en')d.lang='en'}}catch(e){{}}d.classList.add('js');}})();
</script>
<link rel="stylesheet" href="{B}assets/css/halaman.css?v={V}">
<link rel="stylesheet" href="{B}assets/css/kit.css?v=20261123n1">
<link rel="stylesheet" href="{B}assets/css/tanya.css?v=1">
{g}</head>
<body>
<a class="skip" href="#isi" data-en="Skip to content">Langsung ke isi</a>
<div class="sky" aria-hidden="true"></div>
'''

def topbar(B, here=''):
    drop = ''.join(f'<a href="{B}layanan/{s}/">{icon(ic)}<b data-en="{esc(n[1])}">{esc(n[0])}</b>{T(d)}</a>' for s, ic, n, d in PRODUCTS)
    drop += f'<a href="{B}layanan/">{icon("platform")}<b data-en="All services">Semua layanan</b>{T(("Bandingkan semuanya dalam satu halaman.", "Compare everything on one page."))}</a>'
    def L(key, href, p):
        c = ' class="is-here"' if here == key else ''
        return f'<a{c} href="{href}" data-en="{esc(p[1])}">{esc(p[0])}</a>'
    links = (f'<details class="drop"><summary><span data-en="Services">Layanan</span>{CHEV}</summary><div class="drop__box">{drop}</div></details>'
             + L('tema', B + 'tema/', ('Tema', 'Themes')) + L('paket', B + '#paket', ('Paket', 'Packages'))
             + L('demo', B + '?buka=demo', ('Demo', 'Demo')) + L('faq', B + 'faq/', ('FAQ', 'FAQ')) + L('kabar', B + 'kabar/', ('Kabar', 'Journal')))
    sheet = ''.join(f'<a href="{B}layanan/{s}/">{icon(ic)}<span data-en="{esc(n[1])}">{esc(n[0])}</span></a>' for s, ic, n, d in PRODUCTS)
    sheet += '<hr>' + ''.join(f'<a href="{h}">{icon(ic)}<span data-en="{esc(p[1])}">{esc(p[0])}</span></a>' for h, ic, p in [
        (B + 'tema/', 'tema', ('Tema', 'Themes')), (B + '#paket', 'paket', ('Paket', 'Packages')), (B + '?buka=demo', 'demo', ('Coba demo', 'Try a demo')),
        (B + 'faq/', 'tanya', ('Pertanyaan umum', 'Questions')), (B + 'kabar/', 'kabar', ('Kabar Nawala', 'Nawala journal')),
        (B + 'mitra/', 'mitra', ('Kemitraan', 'Partnership')), (B + 'ruang/', 'ruang', ('Ruang pasangan', "The couple's room"))])
    sheet += '<hr><div class="lang" role="group" aria-label="Bahasa" data-en-label="Language"><button type="button" data-lang="id">ID</button><button type="button" data-lang="en">EN</button></div>'
    return f'''<header class="top">
  <div class="top__bar">
    <a class="top__brand" href="{B}" aria-label="Nawala, halaman utama" data-en-label="Nawala, home page"><img src="{B}assets/img/nawala-hero-480.webp" width="480" height="413" alt=""><b>nawala</b></a>
    <nav class="top__links" aria-label="Utama" data-en-label="Main">{links}</nav>
    <div class="lang lang--bar" role="group" aria-label="Bahasa" data-en-label="Language"><button type="button" data-lang="id">ID</button><button type="button" data-lang="en">EN</button></div>
    {wa_btn(('Pesan sekarang', 'Book now'), WA_BOOK, 'btn btn--glow top__cta-s')}
    <details class="top__menu"><summary aria-label="Menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></summary><nav class="top__sheet" aria-label="Menu">{sheet}</nav></details>
  </div>
</header>
'''

def ajak(B, title, text, msg=WA_BOOK):
    return f'''<section class="ajak"><div class="wrap"><div class="ajak__box" data-rise>
  <div>{T(title, 'h2')}{T(text, 'p')}</div>
  <div class="ajak__acts">{wa_btn(('Pesan sekarang', 'Book now'), msg)}<button type="button" class="btn btn--glass" data-pintu="konsultasi" data-en="Free consultation">Konsultasi gratis</button>{link_btn(('Coba demo gratis', 'Try a free demo'), B + '?buka=demo')}</div>
</div></div></section>
'''

def footer(B):
    col1 = ''.join(f'<li><a href="{B}layanan/{s}/" data-en="{esc(n[1])}">{esc(n[0])}</a></li>' for s, ic, n, d in PRODUCTS)
    col1 += f'<li><a href="{B}tema/" data-en="Themes">Tema</a></li><li><a href="{B}#paket" data-en="Packages">Paket</a></li>'
    col2 = ''.join(f'<li><a href="{h}" data-en="{esc(p[1])}">{esc(p[0])}</a></li>' for h, p in [
        (B + 'faq/', ('Pertanyaan umum', 'Questions')), (B + '?buka=demo', ('Coba demo', 'Try a demo')), (B + 'mitra/', ('Kemitraan', 'Partnership')),
        (B + 'sayembara/', ('Sayembara karya', 'Art contest')), (B + 'kabar/', ('Kabar Nawala', 'Nawala journal')), (B + 'ruang/', ('Ruang pasangan', "The couple's room")), (B + 'tim/', ('Konsol tim', 'Team console'))])
    return f'''<footer class="foot">
  <div class="wrap">
    <div class="foot__grid">
      <div class="foot__brand"><b>nawala</b>{T(('Surat yang hidup. Undangan, buku tamu, live streaming, dan persiapan pernikahan dalam satu platform.', 'The living letter. Invitation, guestbook, live streaming and wedding planning on one platform.'), 'p')}
        {wa_btn(('Chat lewat WhatsApp', 'Chat on WhatsApp'), ('Halo Nawala.', 'Hello Nawala.'), 'btn btn--glass')}</div>
      <div>{T(('Layanan', 'Services'), 'h2')}<ul>{col1}</ul></div>
      <div>{T(('Bantuan', 'Help'), 'h2')}<ul>{col2}</ul></div>
      <div>{T(('Layanan pelanggan', 'Customer service'), 'h2')}{T(('24 jam setiap hari lewat WhatsApp, untuk konsultasi maupun pemesanan.', 'Around the clock, every day, on WhatsApp, for questions and bookings.'), 'p')}
        <h2 style="margin-top:1rem" data-en="Payment">Pembayaran</h2><div class="foot__pay"><span data-en="Bank transfer">Transfer bank</span><span data-en="QRIS (soon)">QRIS (segera)</span></div></div>
    </div>
    <div class="foot__small"><span>&copy; 2026 Nawala</span><span>nawalainvite.com</span></div>
  </div>
</footer>
'''

def scripts(B, garis=False):
    g = f'<script type="module" src="{B}assets/js/garis.js?v=6"></script>\n' if garis else ''
    return f'<script src="{B}assets/js/origin.js?v=3" defer></script>\n<script src="{B}assets/js/db.js" defer></script>\n<script src="{B}assets/js/pintu.js?v=1" defer></script>\n<script src="{B}assets/js/tanya.js?v=1" defer></script>\n<script src="{B}assets/js/halaman.js?v={V}" defer></script>\n{g}</body>\n</html>\n'

def crumb(B, items):
    out = [f'<a href="{B}" data-en="Home">Beranda</a>']
    for href, p in items:
        out.append('<span aria-hidden="true">/</span>')
        out.append(f'<a href="{href}" data-en="{esc(p[1])}">{esc(p[0])}</a>' if href else T(p))
    return '<nav class="crumb" aria-label="Lokasi" data-en-label="Breadcrumb">' + ''.join(out) + '</nav>'

def sec_head(title, lead=None, center=False):
    c = ' sec__head--c' if center else ''
    return f'<div class="sec__head{c}">{T(title, "h2")}{T(lead, "p") if lead else ""}</div>'

def feats(items):
    out = []
    for it in items:
        ic, title, text = it[0], it[1], it[2]
        bullets = it[3] if len(it) > 3 else None
        new = it[4] if len(it) > 4 else False
        ul = '<ul>' + ''.join(T(b, 'li') for b in bullets) + '</ul>' if bullets else ''
        tag = f' <span class="tag" data-en="New">Baru</span>' if new else ''
        out.append(f'<article class="feat{" feat--new" if new else ""}" data-rise>{icon(ic)}<h3><span data-en="{esc(title[1])}">{esc(title[0])}</span>{tag}</h3>{T(text, "p")}{ul}</article>')
    return '<div class="feats">' + ''.join(out) + '</div>'

def steps(items):
    out = []
    for title, text, who in items:
        w = T(who, 'span', 'who') if who else ''
        out.append(f'<li class="step" data-rise><div>{T(title, "h3")}{T(text, "p")}{w}</div></li>')
    return '<ol class="steps">' + ''.join(out) + '</ol>'

def incl(items):
    out = []
    for it in items:
        sub = T(it[1], 'span') if len(it) > 1 and it[1] else ''
        out.append(f'<li>{TICK}<div>{T(it[0], "b")}{sub}</div></li>')
    return '<ul class="incl">' + ''.join(out) + '</ul>'

def day(items):
    return '<ol class="day">' + ''.join(f'<li data-rise>{T(t, "time")}{T(h, "h3")}{T(p, "p")}</li>' for t, h, p in items) + '</ol>'

def qa(items, keys=None, pop=()):
    """the questions as <details>; with keys each gets an id (t-<key>, so a link can open it), its category and,
    for the home page's first view, a popular flag"""
    out = []
    for n, (q, a) in enumerate(items):
        paras = a if isinstance(a, list) else [a]
        k = keys[n] if keys else None
        attrs = f' id="t-{k}" data-cat="{CAT_OF.get(k, "")}"' + (' data-pop' if k in pop else '') if k else ''
        out.append(f'<details{attrs}>{T(q, "summary")}<div class="qa__a">{"".join(T(p, "p") for p in paras)}</div></details>')
    return '<div class="qa">' + ''.join(out) + '</div>'

def stage(fig, note=None):
    n = T(note, 'p', 'stage__note') if note else ''
    return f'<div class="stage" data-rise><span class="garis garis--panggung" data-garis="{fig}"></span><p class="svc__cap" aria-hidden="true"></p>{n}</div>'

def phone(B, src, label=('Putar undangan contoh', 'Play the sample invitation')):
    return (f'<div class="phone"><div class="phone__in"><button class="btn btn--glow phone__play" type="button" data-phone="{esc(B + src)}" '
            f'data-en="{esc(label[1])}">{esc(label[0])}</button></div></div>')

# ---------- questions, one list reused by the FAQ page, the product pages and the home page ----------
Q = {
 'pesan': (('Bagaimana cara memesan?', 'How do I book?'), [
   ('Jawab tiga pertanyaan di halaman utama, atau langsung chat kami lewat WhatsApp. Kami membalas, lalu mengirim kode akses ke ruang pasangan kalian. Di sana kalian memilih tema dan mengisi data, atau cukup mengirimnya lewat WhatsApp.',
    'Answer three questions on the home page, or simply chat with us on WhatsApp. We reply and send you an access code to your couple\'s room. There you choose a theme and fill in your details, or you just send them to us on WhatsApp.'),
   ('Tim kami memeriksa, merapikan, lalu menerbitkannya. Pendamping kalian dari tim Nawala menemani dari awal sampai hari H.',
    'Our team checks it, polishes it and publishes it. Your companion from the Nawala team stays with you from the start to the day itself.')]),
 'bayar': (('Bagaimana sistem pembayarannya?', 'How does payment work?'),
   ('Pembayaran dilunasi sebelum hari acara, lewat transfer bank ke rekening Nawala. Pembayaran dengan QRIS segera tersedia. Rincian tagihan kami kirim lewat WhatsApp setelah paket kalian disepakati.',
    'Payment is made in full before the event, by bank transfer to Nawala\'s account. Payment by QRIS is coming soon. We send the itemised bill on WhatsApp once your package is agreed.')),
 'harga': (('Berapa harganya?', 'How much does it cost?'),
   ('Harga mengikuti tingkat tema, layanan yang dipilih, jumlah tamu, dan kota acara. Tanyakan lewat WhatsApp; kami membalas dengan rincian lengkap untuk pernikahan kalian, tanpa biaya tersembunyi.',
    'The price depends on the theme tier, the services you choose, the number of guests and the city of the event. Ask us on WhatsApp and we reply with a full breakdown for your wedding, with no hidden costs.')),
 'kapan': (('Kapan saya bisa menghubungi Nawala?', 'When can I reach Nawala?'),
   ('Kapan saja. Layanan pelanggan kami siap 24 jam setiap hari lewat WhatsApp, untuk konsultasi tema, buku tamu, live streaming, maupun pemesanan.',
    'Any time. Our customer service is there around the clock, every day, on WhatsApp, for questions about themes, the guestbook, live streaming or a booking.')),
 'pic': (('Apakah ada yang mendampingi kami?', 'Will someone guide us?'),
   ('Ya. Setiap pesanan mendapat satu pendamping khusus dari tim Nawala, dari memilih tema sampai hari H. Kalian tidak perlu menjelaskan ulang kepada orang yang berbeda-beda.',
    'Yes. Every booking has one dedicated companion from the Nawala team, from choosing the theme to the day itself. You never have to explain things again to someone new.')),
 'nol': (('Apakah kami harus membuat undangan dari nol?', 'Do we have to make the invitation from scratch?'),
   ('Tidak. Pilih tema dari koleksi Nawala lalu isi data kalian. Kalau ingin mengubah tampilan, kalian bisa menyuntingnya sendiri di editor desain: huruf, kotak di balik tulisan, bingkai foto, dan elemen hiasan. Kalau ingin sesuatu yang benar-benar baru, pilih tema Kustom.',
    'No. Choose a theme from the Nawala collection and fill in your details. To change how it looks you can edit it yourselves in the design editor: fonts, the boxes behind text, photo frames and decorative elements. For something entirely new, choose a Custom theme.')),
 'revisi': (('Berapa kali kami boleh merevisi?', 'How many revisions can we make?'),
   ('Tanpa batas sampai kalian puas. Setelah undangan tayang pun perubahan tetap bisa dibuat; tim kami memeriksanya lalu menerbitkannya ulang.',
    'As many as you need until you are happy. Even after the invitation is live, changes can still be made; our team checks them and publishes again.')),
 'kirim': (('Bagaimana undangan dikirim ke tamu?', 'How is the invitation sent to guests?'),
   ('Setiap tamu punya tautan atas namanya sendiri. Kalian bisa mengirimnya otomatis lewat WhatsApp ke seluruh daftar tamu sekaligus dari ruang kalian, atau mengirimnya satu per satu dengan pesan yang sudah disiapkan.',
    "Every guest has a link in their own name. You can send them automatically on WhatsApp to the whole guest list at once from your room, or one by one with a message we have prepared.")),
 'blokir': (('Apakah nomor WhatsApp kami aman saat mengirim ke banyak tamu?', 'Is our WhatsApp number safe when sending to many guests?'),
   ('Ya. Pengiriman otomatis berjalan lewat jalur resmi WhatsApp Business milik Nawala, bukan dari nomor pribadi kalian, sehingga nomor kalian tidak dipakai untuk mengirim massal.',
    "Yes. Automatic sending goes through Nawala's official WhatsApp Business line, not your personal number, so your number is never used for bulk sending.")),
 'terpisah': (('Apa itu undangan terpisah?', 'What is a split invitation?'),
   ('Satu undangan dengan beberapa versi untuk kelompok tamu yang berbeda. Misalnya keluarga melihat akad dan resepsi, rekan kerja hanya melihat resepsi, dan kerabat yang jauh menerima tautan siaran langsung. Semua dikelola dari satu daftar tamu.',
    'One invitation with several versions for different guest groups. For example, family sees the akad and the reception, colleagues see only the reception, and relatives far away receive the live stream link. All of it is managed from one guest list.')),
 'sandi': (('Bisakah undangan dikunci dengan kata sandi?', 'Can the invitation be locked with a password?'),
   ('Bisa. Undangan hanya terbuka bagi yang mengetahui sandinya, cocok untuk pernikahan yang ingin tetap intim.',
    'Yes. The invitation only opens for those who know the password, which suits a wedding meant to stay intimate.')),
 'aplikasi': (('Apakah tamu perlu memasang aplikasi?', 'Do guests need to install an app?'),
   ('Tidak. Undangan terbuka di browser ponsel apa pun. Kami membuatnya ringan dan lancar, termasuk di ponsel Android kelas menengah ke bawah yang dipakai sebagian besar tamu di Indonesia.',
    'No. The invitation opens in any phone browser. We keep it light and smooth, including on the low and middle-range Android phones most guests in Indonesia use.')),
 'bahasa': (('Apakah undangan bisa dua bahasa?', 'Can the invitation be in two languages?'),
   ('Bisa. Setiap teks tersedia dalam bahasa Indonesia dan Inggris, dan tamu menggantinya dengan satu tombol. Kami tidak mengandalkan terjemahan otomatis.',
    'Yes. Every line is available in Indonesian and English, and guests switch with one button. We do not rely on machine translation.')),
 'masuk': (('Bagaimana tamu masuk dengan buku tamu digital?', 'How do guests check in with the digital guestbook?'),
   ('Tamu menunjukkan kode QR di undangannya kepada penerima tamu. Kode itu dipindai dalam sedetik, namanya muncul di layar sapaan, dan kehadirannya langsung tercatat. Tidak ada antrean menulis di buku.',
    'The guest shows the QR code in their invitation to the usher. It is scanned in a second, their name appears on the greeting screen, and their attendance is recorded at once. Nobody queues to sign a book.')),
 'tanpaqr': (('Bagaimana jika tamu tidak membawa ponsel atau kodenya?', 'What if a guest has no phone or code with them?'),
   ('Penerima tamu mencari namanya di halaman penerima tamu, lalu mencatat kehadirannya. Tamu itu tetap diarahkan ke mejanya.',
    'The usher looks up their name on the ushers\' page and records them as present. The guest is still shown to their table.')),
 'internet': (('Apakah gedung harus menyediakan internet?', 'Does the venue need to provide internet?'),
   ('Tidak. Kami membawa modem internet sendiri untuk buku tamu dan live streaming.',
    'No. We bring our own internet modem for the guestbook and the live stream.')),
 'kru': (('Berapa perangkat dan kru yang datang?', 'How many devices and crew come?'),
   ('Jumlah perangkat, kru teknis, dan penerima tamu menyesuaikan jumlah tamu, banyaknya pintu masuk, dan lama acara. Kami menetapkannya bersama kalian saat pertemuan teknis sebelum hari H.',
    'The number of devices, technical crew and ushers follows the number of guests, the number of entrances and the length of the event. We set it together with you at the technical meeting before the day.')),
 'takdiundang': (('Bagaimana dengan tamu yang tidak diundang?', 'What about uninvited guests?'),
   ('Kode QR hanya dimiliki tamu yang terdaftar. Tamu tanpa kode diarahkan ke penerima tamu, yang menanganinya sesuai keinginan kalian, misalnya dicatat sebagai tamu tambahan atau dilaporkan kepada keluarga.',
    'Only registered guests hold a QR code. Anyone without one is sent to an usher, who handles them the way you choose, for example recording them as an extra guest or letting the family know.')),
 'platform': (('Siaran bisa ditayangkan di mana saja?', 'Where can the stream be shown?'),
   ('Di YouTube, Instagram, TikTok, Zoom, dan Google Meet, bahkan beberapa sekaligus. Tautannya juga kami pasang di dalam undangan, sehingga tamu menonton dari undangannya sendiri.',
    'On YouTube, Instagram, TikTok, Zoom and Google Meet, even several at once. We also place the link inside the invitation, so guests watch from their own invitation.')),
 'siapa': (('Siapa yang mengerjakan live streaming dan buku tamu di lokasi?', 'Who runs the live stream and the guestbook on site?'),
   ('Kru dari jaringan event organizer dan kontraktor produksi rekanan Nawala, yang kami pilih dan kami jamin mutunya. Satu pendamping dari tim Nawala tetap menjadi penghubung kalian dari awal sampai selesai.',
    "Crews from Nawala's network of partner event organisers and production contractors, chosen by us and quality-assured by Nawala. One companion from the Nawala team remains your single contact from start to finish.")),
 'rekaman': (('Apakah kami mendapat rekamannya?', 'Do we get the recording?'),
   ('Ya. Rekaman penuh acara kami serahkan setelah hari H, untuk kalian simpan selamanya.',
    'Yes. We hand over the full recording after the day, for you to keep for good.')),
 'pm': (('Apa itu Persiapan?', 'What is Persiapan?'),
   ('Ruang perencanaan pernikahan yang kalian pakai bersama tim Nawala: struktur pekerjaan (WBS), papan tugas, garis waktu sampai hari H, anggaran dengan tahap pembayaran, vendor, rundown, catatan rapat, persetujuan, berkas, pengingat, dan obrolan.',
    'A wedding planning room you share with the Nawala team: a work breakdown (WBS), a task board, a timeline to the day, a budget with payment stages, vendors, the rundown, meeting notes, approvals, files, reminders and a chat.')),
 'pmlihat': (('Siapa yang bisa melihat ruang Persiapan?', 'Who can see the Persiapan room?'),
   ('Kalian berdua dan tim Nawala. Kalian bisa mengubah semua yang kalian lihat, dan setiap perubahan tercatat. Catatan internal tim tetap tersembunyi dari pasangan.',
    "The two of you and the Nawala team. You can change everything you see, and every change is recorded. The team's internal notes stay hidden from the couple.")),
 'pmlama': (('Sampai kapan ruang Persiapan bisa dipakai?', 'How long can we use the Persiapan room?'),
   ('Sampai 30 hari setelah tanggal pernikahan, sehingga pelunasan vendor dan berkas terakhir masih bisa kalian selesaikan.',
    'Until 30 days after the wedding date, so you can still settle the last vendor payments and files.')),
 'pmtambah': (('Apakah Persiapan termasuk di setiap pesanan?', 'Is Persiapan part of every booking?'),
   ('Bagian pengerjaan undangan selalu ada untuk setiap pesanan, di semua tingkat tema. Perencanaan pernikahan penuh, dari gedung, katering, rias, sampai dekorasi, adalah layanan tambahan yang kami aktifkan bila kalian memesannya.',
    'The invitation work is there for every booking, at every theme tier. Full wedding planning, from the venue and catering to make-up and decoration, is an add-on we switch on when you book it.')),
 'data': (('Di mana data tamu disimpan, dan siapa yang bisa melihatnya?', 'Where is guest data kept, and who can see it?'),
   ('Di basis data Nawala. Daftar tamu, jawaban, dan ucapan hanya bisa dilihat oleh kalian dan tim Nawala. Seorang tamu hanya melihat undangannya sendiri dan mejanya sendiri, tidak pernah daftar tamu lain.',
    "In Nawala's database. The guest list, answers and wishes can only be seen by you and the Nawala team. A guest only sees their own invitation and their own table, never the list of other guests.")),
 'kode': (('Untuk apa kode akses?', 'What is the access code for?'),
   ('Kode akses membuka ruang pasangan kalian: menyimpan dan menyaring tema, mengisi data, menyunting desain, mengelola tamu, dan Persiapan. Kode baru berlaku 30 hari, dan kami perpanjang selama kalian membutuhkannya.',
    'The access code opens your couple\'s room: saving and narrowing themes, filling in details, editing the design, managing guests, and Persiapan. A new code is valid for 30 days, and we extend it for as long as you need it.')),
 'tema': (('Ada berapa tema?', 'How many themes are there?'),
   (f'Saat ini {N["tema"]} tema dalam empat tingkat: {N["dasar"]} Dasar, {N["premium"]} Premium, {N["eksklusif"]} Eksklusif, ditambah Kustom yang dibuat khusus. {N["contoh"]} di antaranya sudah punya undangan contoh yang bisa dibuka.',
    f'Right now there are {N["tema"]} themes in four tiers: {N["dasar"]} Basic, {N["premium"]} Premium, {N["eksklusif"]} Exclusive, plus Custom, made just for you. {N["contoh"]} of them already have a sample invitation you can open.')),
 'rsvpasisten': (('Apa bedanya Asisten RSVP dengan RSVP di undangan?', 'How is RSVP Assistance different from the RSVP in the invitation?'),
   ('RSVP di undangan menunggu tamu menjawab sendiri. Asisten RSVP berarti tim Nawala yang aktif menanyakan: mengirim, mengingatkan, dan pada skema duduk menelepon, sampai jawabannya lengkap.',
    'The RSVP in the invitation waits for guests to answer on their own. RSVP Assistance means the Nawala team actively asks: sending, reminding and, in the seated scheme, calling, until the answers are complete.')),
 'selamanya': (('Berapa lama undangan bisa dibuka?', 'How long can the invitation be opened?'),
   ('Selamanya. Tautan undangan tidak kedaluwarsa, sehingga kalian dan tamu bisa membukanya lagi sebagai kenang-kenangan.',
    'For good. The invitation link does not expire, so you and your guests can open it again as a keepsake.')),
 'acaralain': (('Apakah Nawala juga untuk acara selain pernikahan?', 'Is Nawala also for events other than weddings?'),
   ('Ya. Lamaran, aqiqah, khitanan, ulang tahun, dan syukuran memakai tema dan fitur yang sama, termasuk buku tamu digital.',
    'Yes. Engagements, aqiqah, khitanan, birthdays and thanksgivings use the same themes and features, the digital guestbook included.')),
 'transport': (('Apakah ada biaya transportasi untuk kru?', 'Is there a transport charge for the crew?'),
   ('Untuk acara di Kota Bandung, tidak ada biaya transportasi tambahan. Untuk kota lain, kami menghitungnya bersama kalian saat menyusun penawaran.',
    'For events in the city of Bandung there is no extra transport charge. For other cities we work it out with you when we put the quote together.')),
 'konsultasi': (('Apakah konsultasinya gratis?', 'Is the consultation free?'),
   ('Gratis. Isi nama, nomor WhatsApp, dan bulan pernikahan sekali saja; kalian langsung mendapat kode akses untuk membuka semua tema, dan tim kami menghubungi untuk konsultasi atau mengirim daftar harga.',
    'Free. Fill in your name, WhatsApp number and wedding month once; you get an access code that opens every theme straight away, and our team contacts you for the consultation or sends the price list.')),
 'imajinasi': (('Bisakah kami mencoba tema dengan foto kami sendiri?', 'Can we try a theme with our own photos?'),
   ('Bisa. Buka undangan contoh mana pun, lalu ketuk Ruang Imajinasi. Masukkan foto, nama, dan tanggal kalian, dan undangan langsung menampilkannya. Foto tetap di ponsel kalian dan tidak dikirim ke mana pun.',
    'Yes. Open any sample invitation and tap Imagination Room. Put in your photos, names and date, and the invitation shows them at once. The photos stay on your phone and are not sent anywhere.')),
}
def qs(*keys, pop=()): return qa([Q[k] for k in keys], keys, pop)

def tanya_tools(sticky=False):
    """search pill, category chips and a live count, after the Jabar Open FAQ (assets/js/tanya.js does the work)"""
    chips = ''.join(f'<button type="button" class="tanya__chip" data-cat="{k}" data-en="{esc(t[1])}">{esc(t[0])}</button>' for k, t, _ in FAQ_GROUPS)
    return (f'<div class="tanya__tools{" is-sticky" if sticky else ""}">'
            '<label class="tanya__search"><span class="sr" data-en="Search questions">Cari pertanyaan</span>'
            '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>'
            '<input type="search" autocomplete="off" placeholder="Ketik kata kunci, mis. QRIS, revisi, kru" data-en-placeholder="Type a keyword, e.g. QRIS, revision, crew">'
            '<button type="button" class="tanya__clear" hidden aria-label="Hapus pencarian" data-en-label="Clear search"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></label>'
            f'<div class="tanya__chips" role="group" aria-label="Kategori" data-en-label="Categories"><button type="button" class="tanya__chip" data-cat="*" data-en="All">Semua</button>{chips}</div>'
            '<p class="tanya__count" aria-live="polite"></p></div>')

def tanya_none():
    return ('<p class="tanya__none" hidden><span data-en="No question matches. Try another word, or ask us on WhatsApp.">Tidak ada pertanyaan yang cocok. Coba kata lain, atau tanyakan langsung lewat WhatsApp.</span> '
            + wa_btn(('Tanya lewat WhatsApp', 'Ask on WhatsApp'), ('Halo Nawala, saya punya pertanyaan.', 'Hello Nawala, I have a question.'), 'btn btn--glass btn--sm') + '</p>')

# ---------- product pages ----------
def page_product(slug):
    B = '../../'
    P = {s: (ic, n, d) for s, ic, n, d in PRODUCTS}
    ic, name, _ = P[slug]
    C = PRODUCT_COPY[slug]
    out = head(B, C['title'][0], C['desc'][0], C['title'][1], garis=bool(C.get('fig')))
    out += topbar(B, '')
    out += '<main id="isi">\n'
    fig = stage(C['fig'], C.get('fignote')) if C.get('fig') else C.get('figure', lambda B: '')(B)
    chips = '<div class="head__chips">' + ''.join(f'<span class="chip"><i></i>{T(c)}</span>' for c in C['chips']) + '</div>'
    acts = (wa_btn(('Pesan sekarang', 'Book now'), C['wa']) + '<button type="button" class="btn btn--glass" data-pintu="konsultasi" data-en="Free consultation">Konsultasi gratis</button>'
            + ''.join(link_btn(l, h, lang=True) for l, h in C['acts']))
    out += f'''<section class="head"><div class="wrap head__grid">
  <div>{crumb(B, [(B + 'layanan/', ('Layanan', 'Services')), (None, name)])}
    <h1 data-en="{esc(C['h1'][1])}">{esc(C['h1'][0])}</h1>{T(C['lead'], 'p', 'head__lead')}
    <div class="head__acts">{acts}</div>{chips}</div>
  {fig}
</div></section>
'''
    for block in C['blocks']:
        out += block(B)
    out += ajak(B, C['ajak'][0], C['ajak'][1], C['wa'])
    out += '</main>\n' + footer(B) + scripts(B, garis=bool(C.get('fig')))
    return out

def S(inner, glass=True, id_=None):
    i = f' id="{id_}"' if id_ else ''
    if glass:
        return f'<section class="sec"{i}><div class="wrap"><div class="panel">{inner}</div></div></section>\n'
    return f'<section class="sec"{i}><div class="wrap">{inner}</div></section>\n'

PRODUCT_COPY = {}

# Undangan digital ------------------------------------------------------------
PRODUCT_COPY['undangan-digital'] = dict(
 title=('Undangan digital Nawala', 'Nawala digital invitation'),
 desc=('Undangan pernikahan digital atas nama tiap tamu: dikirim otomatis lewat WhatsApp, RSVP, amplop digital, undangan terpisah, dua bahasa, dan editor desain.', ''),
 h1=('Undangan yang menyapa setiap tamu dengan namanya.', 'An invitation that greets every guest by name.'),
 lead=('Setiap tamu menerima suratnya sendiri. Undangan dibuka seperti hadiah, membawa tamu ke dunia yang kalian pilih, lalu mencatat jawaban dan ucapan mereka. Di hari H, tautan yang sama menjadi tanda masuk dan penunjuk meja.',
       'Every guest receives a letter of their own. It opens like a gift, takes them into the world you chose, then records their answer and their wishes. On the day, the same link becomes their entry pass and their table finder.'),
 chips=[(f'{N["tema"]} tema', f'{N["tema"]} themes'), (f'{N["contoh"]} contoh siap dibuka', f'{N["contoh"]} samples to open'), ('Revisi tanpa batas', 'Unlimited revisions'), ('Indonesia dan Inggris', 'Indonesian and English')],
 acts=[(('Lihat koleksi tema', 'See the themes'), '../../tema/')],
 wa=('Halo Nawala, saya ingin memesan undangan digital.', 'Hello Nawala, I would like to book a digital invitation.'),
 fig='amplop', fignote=('Gerakkan kursor atau geser dengan jari: amplopnya terbuka.', 'Move your cursor or drag with a finger: the envelope opens.'),
 ajak=(('Mulai undangan kalian hari ini.', 'Start your invitation today.'), ('Ceritakan tanggal dan tema impian kalian lewat WhatsApp. Kami kirim kode akses ruang pasangan, dan pendamping kalian siap membantu.', 'Tell us your date and your dream theme on WhatsApp. We send the access code to your couple\'s room, and your companion is ready to help.')),
)
def _ud_blocks():
    def feats_b(B):
        return S(sec_head(('Semua yang dibutuhkan undangan kalian.', 'Everything your invitation needs.'),
                          ('Bukan sekadar halaman dengan nama dan tanggal. Ini yang kalian dapatkan di setiap undangan Nawala, apa pun tingkat temanya.',
                           'Not just a page with names and a date. This is what every Nawala invitation gives you, whatever its tier.')) + feats([
          ('nama', ('Atas nama tiap tamu', "In each guest's name"), ('Setiap tamu punya tautan sendiri. Undangan terbuka dengan amplop bertuliskan namanya, sehingga terasa ditujukan kepadanya dan benar-benar dibuka, bukan dilewati di grup chat.',
            'Every guest has a link of their own. It opens with an envelope bearing their name, so it feels addressed to them and actually gets opened, not scrolled past in a group chat.')),
          ('kirim', ('Kirim otomatis lewat WhatsApp', 'Automatic sending on WhatsApp'), ('Kirim ke seluruh daftar tamu sekaligus dari ruang kalian, dengan nama tiap tamu terisi sendiri. Pengiriman berjalan lewat jalur resmi WhatsApp Business milik Nawala, jadi nomor pribadi kalian aman.',
            "Send to the whole guest list at once from your room, each guest's name filled in for you. It goes through Nawala's official WhatsApp Business line, so your personal number stays safe."),
            [('Atau kirim satu per satu dengan pesan siap pakai', 'Or send one by one with a ready message'), ('Tamu yang sudah dikirimi tertanda otomatis', 'Guests already sent to are marked for you')], True),
          ('bagi', ('Undangan terpisah', 'Split invitation'), ('Satu undangan, beberapa versi. Keluarga melihat akad dan resepsi, rekan kerja hanya resepsi, kerabat jauh menerima tautan siaran. Semuanya diatur dari satu daftar tamu.',
            'One invitation, several versions. Family sees the akad and the reception, colleagues only the reception, relatives far away get the stream link. All set from one guest list.')),
          ('hadir', ('Konfirmasi kehadiran (RSVP)', 'Attendance (RSVP)'), ('Tamu menjawab hadir atau tidak dan berapa orang yang datang. Jawaban tersimpan dan langsung terlihat di ruang kalian, dicocokkan dengan daftar tamu.',
            'Guests say whether they are coming and how many people. Answers are saved and show up in your room at once, matched to your guest list.')),
          ('ucap', ('Ucapan dan doa', 'Wishes and prayers'), ('Tamu menuliskan ucapan untuk kalian di undangan. Kalian bisa menyembunyikan ucapan yang tidak pantas dari konsol.',
            'Guests write their wishes to you in the invitation. You can hide any message that does not belong.')),
          ('kado', ('Amplop digital dan kado', 'Digital gift and registry'), ('Rekening untuk angpao digital, sampai tiga rekening, ditambah alamat pengiriman kado. Tamu menyalin nomornya dengan satu ketukan.',
            'Accounts for a digital angpao, up to three, plus an address for gifts. Guests copy the number with one tap.')),
          ('kuota', ('Kuota per tamu', 'A quota per guest'), ('Tentukan berapa orang yang boleh datang untuk setiap undangan, misalnya dua orang untuk pasangan suami istri. Tamu memilih jumlahnya di RSVP, tidak bisa melebihi kuotanya.',
            'Set how many people may come on each invitation, for example two for a married couple. Guests choose their number in the RSVP and cannot go over it.'), None, True),
          ('acara', ('Acara per tamu', 'Events per guest'), ('Tandai setiap tamu untuk akad, resepsi, atau keduanya. Undangannya hanya menampilkan acara yang memang untuknya, dan hitungan tamu per acara terpisah dengan sendirinya.',
            'Mark each guest for the akad, the reception or both. Their invitation shows only the events meant for them, and the guest count for each event is kept separately.'), None, True),
          ('kunci', ('Dikunci dengan kata sandi', 'Password protection'), ('Untuk pernikahan yang ingin tetap intim: undangan hanya terbuka bagi yang mengetahui sandinya.',
            'For a wedding meant to stay intimate: the invitation only opens for those who know the password.')),
          ('kuas', ('Editor desain', 'Design editor'), (f'Sunting sendiri seperti di Canva, tanpa menulis kode: {N["huruf"]} jenis huruf, kotak di balik setiap tulisan, {N["bingkai"]} bingkai foto, {N["elemen"]} elemen hiasan, dan pembuka undangan. Setiap perubahan diperiksa tim sebelum tayang.',
            f'Edit it yourselves as in Canva, with no code: {N["huruf"]} fonts, a box behind every text, {N["bingkai"]} photo frames, {N["elemen"]} decorative elements, and the opening. Every change is checked by our team before it goes live.')),
          ('orang', ('Pendamping khusus', 'A dedicated companion'), ('Satu orang dari tim Nawala menemani kalian dari memilih tema sampai hari H, dan layanan pelanggan siap 24 jam lewat WhatsApp.',
            'One person from the Nawala team stays with you from choosing a theme to the day itself, and customer service is there around the clock on WhatsApp.')),
          ('ulang', ('Revisi tanpa batas', 'Unlimited revisions'), ('Ubah sampai kalian puas, juga setelah undangan tayang. Tim kami memeriksa lalu menerbitkannya ulang.',
            'Change it until you are happy, even after it is live. Our team checks it and publishes again.')),
          ('bahasa', ('Indonesia dan Inggris', 'Indonesian and English'), ('Setiap teks tersedia dalam dua bahasa dan tamu menggantinya dengan satu tombol, tanpa terjemahan otomatis yang kaku.',
            'Every line is there in two languages and guests switch with one button, with no stiff machine translation.')),
          ('musik', ('Musik, peta, dan hitung mundur', 'Music, map and countdown'), ('Musik latar, hitung mundur, tombol simpan ke kalender, peta lokasi tiap acara, galeri foto, kisah kalian, kode busana, dan tautan siaran langsung.',
            'Background music, a countdown, save-to-calendar, a map for each event, a photo gallery, your story, a dress code and the live stream link.')),
          ('selamanya', ('Aktif selamanya', 'Active for good'), ('Tautan undangan tidak kedaluwarsa. Kalian dan tamu bisa membukanya lagi bertahun-tahun kemudian sebagai kenang-kenangan.',
            'The invitation link does not expire. You and your guests can open it again years later as a keepsake.'), None, True),
          ('foto', ('Galeri tanpa batas', 'An unlimited gallery'), ('Masukkan foto prewedding sebanyak yang kalian mau. Foto diperkecil otomatis agar undangan tetap ringan dibuka.',
            'Add as many prewedding photos as you like. They are resized for you so the invitation stays light to open.')),
          ('acara', ('Bukan hanya pernikahan', 'Not only weddings'), ('Lamaran, aqiqah, khitanan, ulang tahun, dan syukuran memakai tema dan fitur yang sama: undangan atas nama, RSVP, dan buku tamu.',
            'Engagements, aqiqah, khitanan, birthdays and thanksgivings use the same themes and features: invitations by name, RSVP and the guestbook.'), None, True),
          ('alamat', ('Alamat kalian sendiri', 'An address of your own'), ('Undangan tinggal di nawalainvite.com/nama-kalian, dan tiap tamu mendapat tautan dengan namanya di ujungnya.',
            "Your invitation lives at nawalainvite.com/your-names, and each guest's link carries their name at the end.")),
          ('kilat', ('Ringan di ponsel apa pun', 'Light on any phone'), ('Kami membangun tanpa pustaka yang berat dan menguji di ukuran ponsel, karena sebagian besar tamu membuka undangan di ponsel Android kelas menengah ke bawah. Lambat berarti ditutup.',
            'We build without heavy libraries and test at phone sizes, because most guests open invitations on low and middle-range Android phones. Slow means closed.')),
          ('qr', ('Menjadi tiket di hari H', 'It becomes the ticket on the day'), ('Tautan yang sama membawa kode QR untuk buku tamu, penunjuk meja, kode souvenir, dan album foto bersama.',
            'The same link carries the QR code for the guestbook, the table finder, the souvenir code and the shared photo album.')),
        ]))
    def tiers_b(B):
        cards = [
          (('Dasar', 'Basic'), f'{N["dasar"]}', ('Undangan gulir yang akrab dan terbukti disukai: satu lukisan atau foto, kartu yang mudah dibaca, bingkai untuk foto kalian. Dua keluarga: foto dan lukisan.',
            'The familiar scrolling invitation people already love: one painting or photo, easy-to-read cards, frames for your photos. Two families: photographic and painted.'), B + 'tema/?tier=dasar'),
          (('Premium', 'Premium'), f'{N["premium"]}', ('Dunia yang bisa dimasuki: film pembuka, panel kaca di dalam pemandangan, satu geser satu langkah, dan Nawala yang menemani tamu. Setiap dunia punya arah perjalanannya sendiri.',
            'A world to walk into: an opening film, glass panels standing in the scenery, one swipe one step, and Nawala guiding the guest. Every world has its own direction of travel.'), B + 'tema/?tier=premium'),
          (('Eksklusif', 'Exclusive'), f'{N["eksklusif"]}', ('Dijual kepada satu pasangan saja. Setelah dimiliki, tema itu tidak dipakai lagi untuk siapa pun dan ditandai sebagai milik kalian.',
            'Sold to one couple only. Once it is yours, it is never used for anyone else and is marked as owned.'), B + 'tema/?tier=eksklusif'),
          (('Kustom', 'Custom'), None, ('Dibuat dari nol dari inspirasi kalian sendiri: kirim foto, video, atau cerita, lalu panggilan video sampai kami benar-benar paham, rancangan untuk kalian setujui, dan produksi.',
            'Built from scratch from your own inspiration: send photos, videos or a story, then a video call until we truly understand, a concept for you to approve, and production.'), B + 'tema/?tier=kustom'),
        ]
        h = ''
        for nm, n, txt, href in cards:
            cnt = f'<span class="n" data-en="{n} themes">{n} tema</span>' if n else '<span class="n" data-en="Made for you">Dibuat untuk kalian</span>'
            h += f'<article class="card" data-rise>{T(nm, "h3")}{cnt}{T(txt, "p")}{link_btn(("Lihat tema " + nm[0], "See " + nm[1] + " themes"), href)}</article>'
        return S(sec_head(('Empat tingkat tema.', 'Four theme tiers.'), ('Dari yang sederhana dan aman sampai yang hanya untuk kalian. Fiturnya sama di semua tingkat; yang berbeda adalah pengalaman dan keunikannya.',
                                                                  'From simple and safe to made only for you. The features are the same at every tier; what changes is the experience and how unique it is.')) + f'<div class="cards cards--4">{h}</div>', glass=False)
    def live_b(B):
        return S(f'''<div class="live"><div>{sec_head(('Coba sendiri, sebagai tamu.', 'Try it yourself, as a guest.'), ('Ini undangan contoh sungguhan untuk pasangan contoh Laras dan Bima. Ketuk amplopnya, lalu jelajahi langkah demi langkah seperti tamu kalian nanti.', 'This is a real sample invitation for our sample couple, Laras and Bima. Tap the envelope, then walk it step by step as your guests will.'))}
          <div class="head__acts">{link_btn(('Buka contoh Premium di tab baru', 'Open the Premium sample in a new tab'), B + 'undangan/?to=Bapak+dan+Ibu+Santoso', lang=True, new=True)}{link_btn(('Buka contoh Dasar', 'Open a Basic sample'), B + 'undangan/dasar.html?tema=sage&to=Bapak+dan+Ibu+Santoso', lang=True, new=True)}</div>
          {T(('Pengantin dalam contoh adalah Nawala, surat bersayap kami. Foto kalian sendiri yang nanti menggantikannya.', 'The bride and groom in the sample are Nawala, our winged letter. Your own photos take its place.'), 'p', 'note')}</div>
          {phone(B, 'undangan/?to=Bapak+dan+Ibu+Santoso')}</div>''')
    def how_b(B):
        return S(sec_head(('Dari pesan pertama sampai tayang.', 'From the first message to live.')) + steps([
          (('Hubungi kami', 'Get in touch'), ('Jawab tiga pertanyaan di halaman utama atau chat lewat WhatsApp: nama, bulan pernikahan, dan nomor yang bisa dihubungi.', 'Answer three questions on the home page or chat on WhatsApp: your name, the wedding month and a number to reach you.'), ('Kalian', 'You')),
          (('Terima kode akses', 'Receive your access code'), ('Kami membalas dan mengirim kode akses ke ruang pasangan kalian, tempat semua pekerjaan berlangsung.', 'We reply and send the access code to your couple\'s room, where all the work happens.'), ('Tim Nawala', 'Nawala team')),
          (('Pilih tema', 'Choose a theme'), ('Jawab lima pertanyaan singkat, geser untuk menyimpan atau melewati, lalu persempit pilihan sampai tersisa satu. Kalian bisa meminta panggilan video bila ingin berdiskusi.', 'Answer five short questions, swipe to save or pass, then narrow it down to one. Ask for a video call whenever you want to talk it through.'), ('Kalian', 'You')),
          (('Isi data', 'Fill in your details'), ('Nama, orang tua, acara, foto, kisah, amplop digital, dan daftar tamu, langsung di ruang kalian. Atau kirim semuanya lewat WhatsApp dan kami yang mengisikan.', 'Names, parents, events, photos, your story, digital gift and the guest list, right in your room. Or send it all on WhatsApp and we fill it in.'), ('Kalian atau tim Nawala', 'You or the Nawala team')),
          (('Diperiksa dan disempurnakan', 'Checked and refined'), ('Tim kami memeriksa setiap teks dan foto, merapikan tampilan, lalu mengirim pratinjau. Revisi sebanyak yang kalian perlukan.', 'Our team checks every word and photo, polishes the layout and sends a preview. As many revisions as you need.'), ('Tim Nawala', 'Nawala team')),
          (('Tayang dan dikirim', 'Live and sent'), ('Undangan terbit di alamat kalian sendiri, lalu dikirim ke seluruh tamu sekaligus lewat WhatsApp atau satu per satu.', 'The invitation goes live at your own address, then goes out to every guest at once on WhatsApp or one by one.'), ('Kalian dan tim Nawala', 'You and the Nawala team')),
          (('Hari H', 'The day'), ('Undangan yang sama menjadi tiket masuk, penunjuk meja, kode souvenir, dan album foto bersama.', 'The same invitation becomes the entry pass, the table finder, the souvenir code and the shared photo album.'), None),
        ]))
    def incl_b(B):
        return S(sec_head(('Yang termasuk di setiap undangan.', 'What every invitation includes.')) + incl([
          (('Undangan tanpa batas jumlah tamu', 'No limit on the number of invitations'), ('Tautan pribadi untuk setiap nama di daftar tamu', 'A personal link for every name on the guest list')),
          (('Kirim otomatis lewat WhatsApp', 'Automatic sending on WhatsApp'), ('Lewat jalur resmi Nawala, plus kirim manual dengan pesan siap pakai', "Through Nawala's official line, plus manual sending with ready messages")),
          (('Revisi tanpa batas', 'Unlimited revisions'),), (('Undangan terpisah per kelompok tamu', 'Split invitation per guest group'),),
          (('RSVP dan ucapan tersimpan', 'Saved RSVP and wishes'),), (('Amplop digital dan alamat kado', 'Digital gift and gift address'),),
          (('Kunci kata sandi', 'Password lock'),), (('Editor desain', 'Design editor'),),
          (('Kuota dan acara per tamu', 'Quota and events per guest'),), (('Aktif selamanya', 'Active for good'),),
          (('Galeri foto tanpa batas', 'Unlimited photo gallery'),), (('Ruang Imajinasi di setiap contoh', 'An Imagination Room in every sample'), ('Coba tema dengan foto kalian sendiri sebelum memesan', 'Try a theme with your own photos before booking')),
          (('Musik latar', 'Background music'),), (('Dua bahasa', 'Two languages'),),
          (('Ruang pasangan', "The couple's room"), ('Tema, data, tamu, desain, dan Persiapan dalam satu tempat', 'Themes, details, guests, design and Persiapan in one place')),
          (('Pendamping khusus dan layanan 24 jam', 'A dedicated companion and 24-hour service'),),
        ]) + f'<p class="note" data-en="The price follows the theme tier, the services you choose and the number of guests. Ask on WhatsApp and we send a full breakdown. Payment is made in full before the event, by bank transfer; QRIS is coming soon.">Harga mengikuti tingkat tema, layanan yang dipilih, dan jumlah tamu. Tanyakan lewat WhatsApp dan kami kirim rinciannya. Pembayaran dilunasi sebelum hari acara lewat transfer bank; QRIS segera tersedia.</p>')
    def faq_b(B):
        return S(sec_head(('Pertanyaan tentang undangan digital.', 'Questions about the digital invitation.')) + qs('nol', 'revisi', 'kirim', 'blokir', 'terpisah', 'sandi', 'aplikasi', 'bahasa', 'harga')
                 + f'<p class="note"><a href="{B}faq/" data-en="See every question">Lihat semua pertanyaan</a></p>')
    return [feats_b, live_b, tiers_b, how_b, incl_b, faq_b]
PRODUCT_COPY['undangan-digital']['blocks'] = _ud_blocks()

# Buku tamu digital ------------------------------------------------------------
PRODUCT_COPY['buku-tamu-digital'] = dict(
 title=('Buku tamu digital Nawala', 'Nawala digital guestbook'),
 desc=('Buku tamu digital Nawala: QR pribadi tiap tamu, perangkat dan modem di lokasi, kru teknis, penerima tamu berseragam, layar sapaan, manajemen meja, dan souvenir per kelompok.', ''),
 h1=('Tamu datang, dipindai, disambut namanya.', 'Guests arrive, are scanned, and greeted by name.'),
 lead=('Tanpa antrean di meja buku tamu dan tanpa tamu yang berkeliling mencari kursi. Kami datang dengan perangkat, internet, kru teknis, dan penerima tamu berseragam Nawala, lalu menjaga pintu masuk sampai tamu terakhir tiba.',
       'No queue at the guestbook table and no guests wandering the hall for a seat. We arrive with devices, internet, a technical crew and ushers in Nawala uniform, and look after the entrance until the last guest is in.'),
 chips=[('Kru dan penerima tamu di lokasi', 'Crew and ushers on site'), ('Layar sapaan', 'Greeting screen'), ('Manajemen meja dan kursi', 'Table and seat management'), ('Modem internet sendiri', 'Our own internet modem')],
 acts=[(('Coba demo denah dan kursi', 'Try the seating demo'), '../../undangan/denah-demo.html')],
 wa=('Halo Nawala, saya ingin memesan buku tamu digital.', 'Hello Nawala, I would like to book the digital guestbook.'),
 fig='pintu', fignote=('Ponsel tamu dipindai di gerbang. Sentuh atau gerakkan kursor.', "A guest's phone is read at the gate. Touch it or move your cursor."),
 ajak=(('Pastikan pintu masuk kalian lancar.', 'Make your entrance run smoothly.'), ('Ceritakan tanggal, gedung, dan perkiraan jumlah tamu. Kami susun kebutuhan perangkat dan kru untuk acara kalian.', 'Tell us the date, the venue and roughly how many guests. We plan the devices and crew your event needs.')),
)
def _bt_blocks():
    def feats_b(B):
        return S(sec_head(('Semua yang terjadi di pintu masuk, diurus.', 'Everything at the entrance, handled.'),
                          ('Buku tamu digital Nawala bukan hanya pemindai. Ini layanan lengkap di lokasi, dari persiapan sampai rekap kehadiran.', "Nawala's digital guestbook is not just a scanner. It is a complete on-site service, from preparation to the attendance report.")) + feats([
          ('qr', ('QR pribadi untuk tiap tamu', 'A personal QR for every guest'), ('Setiap undangan membawa kodenya sendiri. Hanya tamu yang terdaftar memilikinya, sehingga tamu yang tidak diundang tersaring di pintu.', 'Every invitation carries its own code. Only registered guests hold one, so uninvited guests are filtered at the door.')),
          ('tablet', ('Perangkat di lokasi', 'Devices on site'), ('Tablet dan pemindai kode QR kami bawa dan pasang di setiap pintu masuk, jadi kalian tidak perlu menyiapkan apa pun.', 'We bring and set up tablets and QR scanners at every entrance, so you prepare nothing.')),
          ('sinyal', ('Internet sendiri', 'Our own internet'), ('Kami membawa modem internet khusus, sehingga buku tamu tetap berjalan meski sinyal gedung lemah.', 'We bring a dedicated internet modem, so the guestbook keeps working even where the venue signal is weak.')),
          ('orang', ('Kru teknis', 'Technical crew'), ('Kru kami memasang perangkat sebelum acara, memandu penerima tamu, dan berjaga sampai acara selesai.', 'Our crew sets the devices up before the event, briefs the ushers and stays on watch until the end.')),
          ('seragam', ('Penerima tamu berseragam Nawala', 'Ushers in Nawala uniform'), ('Penerima tamu kami mengenakan seragam khusus Nawala lengkap dengan tata rias, terlatih menyambut tamu, memindai kode, dan mengarahkan ke meja.', 'Our ushers wear a dedicated Nawala uniform with make-up done, and are trained to welcome guests, scan codes and show them to their table.'), None, True),
          ('foto', ('Swafoto saat masuk', 'A selfie at check-in'), ('Tamu berfoto di meja penerima saat kodenya dipindai. Fotonya tersimpan bersama catatan kehadiran dan bisa tampil di layar sapaan.',
            'Guests have their photo taken at the welcome desk as their code is scanned. The photo is kept with the attendance record and can appear on the greeting screen.'), None, True),
          ('label', ('Pencatatan kado dan angpao', 'Gift and angpao logging'), ('Setiap kado dan amplop dicatat atas nama tamunya, lalu diberi label cetak, sehingga jumlahnya cocok saat dihitung bersama keluarga.',
            "Every gift and envelope is logged in the guest's name and given a printed label, so the count matches when you go through it with the family."), None, True),
          ('label', ('Printer label', 'Label printer'), ('Label untuk amplop, info meja, dan kupon souvenir dicetak langsung di meja penerima tamu.',
            'Labels for envelopes, table information and souvenir coupons are printed right at the welcome desk.')),
          ('undian', ('Sesi doorprize', 'Doorprize session'), ('Undian diambil dari tamu yang benar-benar hadir, langsung dari catatan buku tamu, dan pemenangnya tampil di layar.',
            'The draw is taken from guests who are actually present, straight from the guestbook records, and the winners appear on the screen.'), None, True),
          ('mobil', ('Gratis transportasi di Bandung', 'Free transport in Bandung'), ('Untuk acara di Kota Bandung, perangkat dan kru datang tanpa biaya transportasi tambahan. Kota lain kami hitung bersama.',
            'For events in the city of Bandung, devices and crew come at no extra transport cost. For other cities we work it out together.')),
          ('layar', ('Layar sapaan', 'Greeting screen'), ('Saat kode dipindai, nama tamu muncul di layar besar di pintu masuk dengan ucapan selamat datang dari kalian.', 'When a code is scanned, the guest\'s name appears on a large screen at the entrance with a welcome from you.')),
          ('denah', ('Manajemen meja dan kursi', 'Table and seat management'), ('Susun ruangan sesuai ukuran asli gedung, letakkan meja dan pelaminan, lalu seret nama tamu ke kursinya. Kelompok tamu diberi warna sendiri.', 'Lay out the room at the venue\'s real size, place tables and the stage, then drag guests\' names onto their chairs. Guest groups get their own colour.')),
          ('meja', ('Penunjuk meja untuk tamu', 'A table finder for guests'), ('Tamu yang sudah menjawab hadir melihat "Meja Anda" di undangannya, lengkap dengan letaknya di denah.', 'Guests who answered yes see "Your table" in their invitation, with where it stands on the plan.')),
          ('cari', ('Halaman penerima tamu', "The ushers' page"), ('Penerima tamu mencari nama dalam sedetik dan melihat meja serta kursinya, juga untuk tamu yang lupa membawa ponsel.', 'Ushers find a name in a second and see the table and chairs, also for guests who forgot their phone.')),
          ('souvenir', ('Souvenir per kelompok', 'Souvenirs per group'), ('Satu kode, satu bingkisan, tanpa dobel. Siapkan souvenir yang berbeda untuk keluarga, sahabat, dan rekan kerja.', 'One code, one gift, no doubles. Prepare different souvenirs for family, friends and colleagues.')),
          ('kado', ('QR amplop tercetak', 'Printed gift QR'), ('Kode QR amplop digital kami cetak untuk meja penerima tamu, sehingga tamu bisa memberi angpao tanpa uang tunai.', 'We print the digital gift QR for the welcome table, so guests can give an angpao without cash.')),
          ('unduh', ('Rekap kehadiran', 'Attendance report'), ('Kehadiran tercatat langsung saat dipindai. Setelah acara kalian menerima daftar hadir lengkap, siap dibuka di Excel.', 'Attendance is recorded the moment a code is scanned. After the event you receive the full list, ready to open in Excel.')),
        ]))
    def day_b(B):
        return S(sec_head(('Hari H, dari pintu sampai pulang.', 'The day, from the door to the way home.')) + day([
          (('Sebelum hari H', 'Before the day'), ('Pertemuan teknis', 'Technical meeting'), ('Kita sepakati jumlah pintu, perangkat, kru, dan penerima tamu, menyusun denah, lalu mencetak berkas QR yang diperlukan.', 'We agree the number of entrances, devices, crew and ushers, set the floor plan, and print the QR files needed.')),
          (('Dua jam sebelumnya', 'Two hours before'), ('Pemasangan', 'Setting up'), ('Kru memasang tablet, layar sapaan, dan modem, menguji pemindaian, lalu memandu penerima tamu.', 'The crew sets up tablets, the greeting screen and the modem, tests the scanning and briefs the ushers.')),
          (('Tamu tiba', 'Guests arrive'), ('Pindai dan sapa', 'Scan and greet'), ('Kode dipindai dalam sedetik. Nama muncul di layar sapaan dan kehadiran tercatat.', 'A code is scanned in a second. The name appears on the greeting screen and attendance is recorded.')),
          (('Masuk ruangan', 'Into the hall'), ('Menemukan meja', 'Finding the table'), ('Tamu melihat mejanya di undangan, atau penerima tamu menunjukkannya di denah.', 'Guests see their table in the invitation, or an usher shows it on the plan.')),
          (('Selama acara', 'During the event'), ('Souvenir dan foto', 'Souvenirs and photos'), ('Souvenir ditukar dengan kode, dan tamu mengirim foto ke album bersama kalian.', 'Souvenirs are collected with the code, and guests send photos into your shared album.')),
          (('Setelah acara', 'After the event'), ('Rekap', 'The report'), ('Kalian menerima daftar hadir lengkap. Perangkat dibongkar, dan pintu masuk kembali seperti semula.', 'You receive the full attendance list. The devices are packed away and the entrance is left as it was.')),
        ]), glass=False)
    def demo_b(B):
        return S(f'''<div class="live"><div>{sec_head(('Coba denah dan kursi sekarang.', 'Try the floor plan and seats now.'), ('Susun ruang resepsi pasangan contoh, dudukkan tamu, terbitkan, lalu lihat bagaimana Dinda menemukan mejanya dan penerima tamu mencarinya di pintu. Tanpa kode, tanpa daftar.', "Arrange the sample couple's reception room, seat guests, publish, then see how Dinda finds her table and how an usher looks her up at the door. No code, no sign-up."))}
          <div class="head__acts">{link_btn(('Buka demo denah dan kursi', 'Open the seating demo'), B + 'undangan/denah-demo.html', cls='btn btn--glow', lang=True)}</div></div>
          {stage('denah')}</div>''')
    def incl_b(B):
        return S(sec_head(('Yang termasuk.', 'What is included.')) + incl([
          (('Tablet dan pemindai QR', 'Tablets and QR scanners'), ('Jumlahnya mengikuti pintu masuk dan jumlah tamu', 'The number follows the entrances and the guest count')),
          (('Modem internet, termasuk kuotanya', 'Internet modem, data included'),), (('Kru teknis di lokasi', 'Technical crew on site'),),
          (('Printer label, pencatatan kado dan angpao', 'Label printer, gift and angpao logging'),), (('Swafoto saat masuk dan sesi doorprize', 'Check-in selfie and doorprize session'),),
          (('Transportasi gratis di Kota Bandung', 'Free transport in the city of Bandung'),),
          (('Penerima tamu berseragam Nawala, dengan tata rias', 'Ushers in Nawala uniform, make-up included'),), (('Layar sapaan', 'Greeting screen'),),
          (('Manajemen meja dan kursi', 'Table and seat management'), ('Termasuk halaman penerima tamu dan "Meja Anda" untuk tamu', 'With the ushers\' page and "Your table" for guests')),
          (('QR pribadi dan undangan atas nama tiap tamu', 'A personal QR and invitation for every guest'),),
          (('Berkas QR siap cetak dan QR amplop tercetak', 'Printable QR files and a printed gift QR'),),
          (('Souvenir per kelompok tamu', 'Souvenirs per guest group'),), (('Rekap kehadiran setelah acara', 'Attendance report after the event'),),
          (('Pertemuan teknis sebelum hari H', 'Technical meeting before the day'),), (('Pendamping khusus dan layanan 24 jam', 'A dedicated companion and 24-hour service'),),
        ]) + T(('Lama layanan, jumlah perangkat, kru, dan penerima tamu kami sesuaikan dengan acara kalian. Buku tamu bisa dipesan bersama undangan digital dan live streaming dalam satu pesanan. Pembayaran dilunasi sebelum hari acara.',
                'The service hours and the number of devices, crew and ushers are set for your event. The guestbook can be booked with the digital invitation and live streaming in one order. Payment is made in full before the event.'), 'p', 'note'))
    def faq_b(B):
        return S(sec_head(('Pertanyaan tentang buku tamu digital.', 'Questions about the digital guestbook.')) + qs('masuk', 'tanpaqr', 'internet', 'kru', 'takdiundang', 'siapa', 'data', 'bayar')
                 + f'<p class="note"><a href="{B}faq/" data-en="See every question">Lihat semua pertanyaan</a></p>')
    return [feats_b, day_b, demo_b, incl_b, faq_b]
PRODUCT_COPY['buku-tamu-digital']['blocks'] = _bt_blocks()

# Asisten RSVP (from Invitato's RSVP Assistance, owner 23 Nov 2026: "add anything they have") --------------------
PRODUCT_COPY['rsvp-asisten'] = dict(
 title=('Asisten RSVP Nawala', 'Nawala RSVP Assistance'),
 desc=('Asisten RSVP Nawala: tim kami mengirim undangan, menanyakan kehadiran setiap tamu lewat chat dan telepon, mengingatkan menjelang hari H, dan menyusun meja.', ''),
 h1=('Setiap tamu ditanya, setiap jawaban tercatat.', 'Every guest asked, every answer recorded.'),
 lead=('Menanyakan kehadiran ratusan tamu satu per satu menghabiskan minggu-minggu terakhir sebelum pernikahan. Serahkan kepada tim Nawala: kami mengirim undangan, menindaklanjuti tamu yang belum menjawab, menelepon bila perlu, dan menyerahkan angka yang bisa kalian pegang untuk katering dan kursi.',
       'Asking hundreds of guests one by one eats the last weeks before a wedding. Hand it to the Nawala team: we send the invitations, follow up guests who have not replied, call when needed, and hand you numbers you can rely on for catering and seating.'),
 chips=[('Jalur resmi WhatsApp', 'Official WhatsApp line'), ('Tindak lanjut chat dan telepon', 'Chat and phone follow-up'), ('Pengingat menjelang hari H', 'Reminders before the day'), ('Susunan meja', 'Table arrangement')],
 acts=[(('Coba demo denah dan kursi', 'Try the seating demo'), '../../undangan/denah-demo.html')],
 wa=('Halo Nawala, saya ingin tahu tentang Asisten RSVP.', 'Hello Nawala, I would like to know about RSVP Assistance.'),
 fig='sapa', fignote=('Pesan terkirim, jawaban kembali. Sentuh atau gerakkan kursor.', 'A message out, an answer back. Touch it or move your cursor.'),
 ajak=(('Lepaskan urusan menanyakan tamu.', 'Let go of chasing guests.'), ('Ceritakan jumlah tamu dan tanggal kalian. Kami usulkan skema yang pas, berdiri atau duduk.', 'Tell us your guest count and date. We suggest the scheme that fits, standing or seated.')),
)
def _rsvp_blocks():
    def schemes_b(B):
        return S(sec_head(('Dua skema, sesuai bentuk resepsi.', 'Two schemes, by the shape of the reception.')) + '<div class="split">'
          + f'<article class="card" data-rise>{T(("Skema berdiri", "Standing scheme"), "h3")}<span class="n" data-en="For standing receptions">Untuk resepsi berdiri</span><ul>' + ''.join(T(x, 'li') for x in [
              ('Undangan dan RSVP dikirim atas nama setiap tamu', 'Invitation and RSVP sent in each guest\'s name'),
              ('Dua kali tindak lanjut lewat chat untuk yang belum menjawab', 'Two chat follow-ups for those who have not replied'),
              ('Pengingat acara menjelang hari H', 'An event reminder before the day'),
              ('Rekap jawaban yang selalu terkini', 'An answer report that is always current')]) + '</ul></article>'
          + f'<article class="card card--hi" data-rise>{T(("Skema duduk", "Seated scheme"), "h3")}<span class="n" data-en="For seated receptions">Untuk resepsi duduk</span><ul>' + ''.join(T(x, 'li') for x in [
              ('Semua yang ada di skema berdiri', 'Everything in the standing scheme'),
              ('Tindak lanjut ketiga lewat telepon', 'A third follow-up by phone'),
              ('Susunan meja dan kursi dari jawaban tamu', 'Table and seat arrangement from the answers'),
              ('Nomor meja di undangan setiap tamu', 'The table number in each guest\'s invitation')]) + '</ul></article></div>')
    def feats_b(B):
        return S(sec_head(('Yang dikerjakan tim kami.', 'What our team does.')) + feats([
          ('kirim', ('Jalur resmi WhatsApp', 'The official WhatsApp line'), ('Semua pesan dikirim lewat akun WhatsApp Business resmi Nawala, sehingga tamu tahu pesan itu sungguhan dan nomor pribadi kalian tetap aman.', "Every message goes through Nawala's official WhatsApp Business account, so guests know it is genuine and your personal number stays safe.")),
          ('ucap', ('Tindak lanjut yang sopan', 'Polite follow-ups'), ('Tamu yang belum menjawab disapa lagi dengan pesan yang ramah, pada jam yang wajar, tanpa terasa mendesak.', 'Guests who have not replied are greeted again with a friendly message, at reasonable hours, without feeling pressed.')),
          ('telepon', ('Telepon bila perlu', 'A call when needed'), ('Pada skema duduk, tamu yang tetap belum menjawab kami telepon, karena kursi yang kosong atau kurang sama-sama merepotkan.', 'In the seated scheme, guests who still have not replied get a phone call, because empty or missing seats are both a problem.'), None, True),
          ('kuota', ('Kuota dan acara per tamu', 'Quota and events per guest'), ('Setiap tamu ditanya untuk acaranya sendiri dan tidak bisa melebihi jumlah orang yang kalian tentukan.', 'Each guest is asked about their own events and cannot exceed the number of people you set.')),
          ('lonceng', ('Pengingat hari H', 'Day reminders'), ('Tamu yang hadir menerima pengingat beberapa hari sebelumnya, lengkap dengan waktu, lokasi, dan tautan peta.', 'Guests who are coming receive a reminder a few days before, with the time, place and a map link.')),
          ('denah', ('Susunan meja', 'Table arrangement'), ('Dari jawaban yang masuk, kami susun meja bersama kalian di denah, lalu nomor meja muncul di undangan setiap tamu.', 'From the answers that come in, we arrange the tables with you on the floor plan, then the table number appears in each guest\'s invitation.')),
          ('unduh', ('Laporan yang bisa diunduh', 'A report you can download'), ('Daftar jawaban, jumlah orang per acara, dan catatan tamu, siap dibuka di Excel untuk katering dan keluarga.', 'The answer list, people per event and guest notes, ready to open in Excel for the caterer and the family.')),
          ('orang', ('Manusia, bukan robot', 'People, not a bot'), ('Balasan tamu dibaca dan dijawab oleh tim kami, bukan mesin penjawab otomatis.', 'Guests\' replies are read and answered by our team, not an automatic responder.')),
        ]))
    def how_b(B):
        return S(sec_head(('Bagaimana berjalannya.', 'How it runs.')) + steps([
          (('Daftar tamu', 'The guest list'), ('Kalian menyerahkan daftar tamu dengan nomor WhatsApp, kuota, dan acara tiap tamu, atau kami bantu merapikannya.', 'You hand over the guest list with WhatsApp numbers, quotas and events, or we help tidy it up.'), ('Kalian', 'You')),
          (('Pesan disetujui', 'Messages approved'), ('Kami siapkan pesan undangan, tindak lanjut, dan pengingat untuk kalian setujui.', 'We prepare the invitation, follow-up and reminder messages for your approval.'), ('Tim Nawala', 'Nawala team')),
          (('Dikirim dan ditindaklanjuti', 'Sent and followed up'), ('Undangan dikirim, jawaban dicatat, tamu yang belum menjawab disapa lagi, lalu ditelepon pada skema duduk.', 'Invitations go out, answers are recorded, those who have not replied are greeted again, then called in the seated scheme.'), ('Tim Nawala', 'Nawala team')),
          (('Angka dikunci', 'Numbers locked'), ('Menjelang batas katering, kami serahkan jumlah akhir per acara dan susunan meja.', 'Before the catering deadline we hand over the final count per event and the table arrangement.'), ('Kalian dan tim Nawala', 'You and the Nawala team')),
          (('Hari H', 'The day'), ('Data yang sama dipakai buku tamu digital di pintu masuk.', 'The same data is used by the digital guestbook at the entrance.'), None),
        ]))
    def faq_b(B):
        return S(sec_head(('Pertanyaan tentang Asisten RSVP.', 'Questions about RSVP Assistance.')) + qs('rsvpasisten', 'blokir', 'kirim', 'data', 'bayar')
                 + f'<p class="note"><a href="{B}faq/" data-en="See every question">Lihat semua pertanyaan</a></p>')
    return [schemes_b, feats_b, how_b, faq_b]
PRODUCT_COPY['rsvp-asisten']['blocks'] = _rsvp_blocks()

# Live streaming --------------------------------------------------------------
PRODUCT_COPY['live-streaming'] = dict(
 title=('Live streaming pernikahan Nawala', 'Nawala wedding live streaming'),
 desc=('Live streaming pernikahan: siaran sinematik, kamera bergerak, bingkai sesuai tema, rekaman penuh, banyak platform, dan live cam ke layar gedung.', ''),
 h1=('Yang jauh tetap hadir.', 'Those far away are still there.'),
 lead=('Kakek di kota lain, sahabat di luar negeri, kerabat yang sedang sakit: mereka menyaksikan akad dan resepsi kalian dalam siaran yang sinematik, dari tautan di undangannya sendiri. Kalian menyimpan rekaman penuhnya selamanya.',
       'A grandfather in another city, a friend abroad, a relative who is unwell: they watch your akad and reception in a cinematic broadcast, from the link in their own invitation. You keep the full recording for good.'),
 chips=[('YouTube, Instagram, TikTok, Zoom, Meet', 'YouTube, Instagram, TikTok, Zoom, Meet'), ('Rekaman penuh', 'Full recording'), ('Live cam ke layar gedung', 'Live cam to the venue screen')],
 acts=[],
 wa=('Halo Nawala, saya ingin memesan live streaming pernikahan.', 'Hello Nawala, I would like to book wedding live streaming.'),
 fig=None,
 figure=lambda B: f'''<div class="stage siaran" data-rise aria-hidden="true">
   <div class="siaran__screen" style="background-image:url('{B}assets/img/putih/plate-arch-mobile.webp')">
     <span class="siaran__live"><i></i><span data-en="Live">Langsung</span></span>
     <span class="siaran__frame"><b>Laras &amp; Bima</b><span data-en="Akad, 12 June 2027">Akad, 12 Juni 2027</span></span>
     <span class="siaran__bar"><i></i></span>
   </div>
   <div class="siaran__to">{''.join(f'<span>{x}</span>' for x in ['YouTube','Instagram','TikTok','Zoom','Google Meet'])}</div>
   <p class="stage__note" data-en="An example of the broadcast frame, with your names, in your theme.">Contoh bingkai siaran, dengan nama kalian, senada dengan tema.</p>
 </div>''',
 ajak=(('Biarkan semua orang tercinta menyaksikan.', 'Let everyone you love be there.'), ('Ceritakan tanggal, gedung, dan siapa yang akan menonton. Kami susun siaran yang pas untuk acara kalian.', 'Tell us the date, the venue and who will be watching. We plan the broadcast that fits your event.')),
)
def _ls_blocks():
    def feats_b(B):
        return S(sec_head(('Siaran yang layak untuk hari kalian.', 'A broadcast worthy of your day.'),
                          ('Dikerjakan oleh kru dari jaringan event organizer dan kontraktor produksi rekanan, yang kami pilih dan kami jamin mutunya. Kalian cukup berhubungan dengan satu pendamping dari Nawala.',
                           'Run by crews from our network of partner event organisers and production contractors, chosen and quality-assured by Nawala. You deal with just one companion from Nawala.')) + feats([
          ('kamera', ('Siaran sinematik', 'A cinematic broadcast'), ('Gambar ditata seperti film pernikahan, bukan sekadar kamera yang diletakkan di sudut ruangan.', 'Shots are composed like a wedding film, not a camera left in a corner.')),
          ('gerak', ('Kamera bergerak', 'Moving cameras'), ('Operator kamera mengikuti momen penting: ijab kabul, kirab, sungkeman, dan saat-saat yang tidak bisa diulang.', 'Camera operators follow the key moments: the vows, the procession, the sungkeman, the moments that cannot be repeated.')),
          ('bingkai', ('Bingkai sesuai tema', 'A frame to match your theme'), ('Siaran diberi bingkai dengan nama kalian, senada dengan tema undangan.', 'The stream carries a frame with your names, in tune with your invitation theme.')),
          ('platform', ('Banyak platform sekaligus', 'Several platforms at once'), ('YouTube, Instagram, TikTok, Zoom, dan Google Meet, bahkan beberapa bersamaan, sesuai tempat keluarga kalian biasa menonton.', 'YouTube, Instagram, TikTok, Zoom and Google Meet, even several together, wherever your family usually watches.')),
          ('layar', ('Live cam ke layar gedung', 'Live cam to the venue screen'), ('Gambar kamera ditampilkan di layar dalam gedung, sehingga tamu di kursi belakang tetap melihat pelaminan dengan jelas.', 'The camera feed is shown on screens in the hall, so guests in the back rows still see the stage clearly.')),
          ('rekam', ('Rekaman penuh', 'A full recording'), ('Seluruh acara direkam dan diserahkan kepada kalian setelah hari H, untuk disimpan selamanya.', 'The whole event is recorded and handed to you after the day, to keep for good.')),
          ('surat', ('Tonton dari undangan', 'Watch from the invitation'), ('Tautan siaran dipasang di dalam undangan. Dengan undangan terpisah, tautan itu bisa khusus untuk tamu yang menonton dari jauh.', 'The stream link sits inside the invitation. With a split invitation it can go only to guests watching from afar.')),
          ('sinyal', ('Internet khusus', 'Dedicated internet'), ('Modem internet sendiri untuk siaran, terpisah dari jaringan gedung, agar gambar tidak putus.', 'Our own internet modem for the broadcast, separate from the venue network, so the picture does not drop.')),
          ('rapat', ('Pertemuan teknis', 'Technical meeting'), ('Sebelum hari H kami meninjau lokasi, rundown, dan titik kamera bersama kalian, lalu menguji siaran.', 'Before the day we go over the venue, the rundown and the camera positions with you, then test the broadcast.')),
        ]))
    def day_b(B):
        return S(sec_head(('Bagaimana kami menyiapkannya.', 'How we prepare it.')) + day([
          (('Saat memesan', 'At booking'), ('Konsultasi', 'Consultation'), ('Kita bicarakan siapa yang menonton, platform yang dipakai, dan bagian acara yang disiarkan.', 'We talk about who will watch, which platforms to use and which parts of the event to stream.')),
          (('Sebelum hari H', 'Before the day'), ('Pertemuan teknis dan survei', 'Technical meeting and survey'), ('Titik kamera, jalur kabel, sinyal, dan rundown disepakati bersama kru.', 'Camera positions, cable routes, signal and the rundown are agreed with the crew.')),
          (('Hari H, lebih awal', 'The day, early'), ('Pemasangan dan uji siaran', 'Set-up and test'), ('Kamera, bingkai, dan modem dipasang, lalu siaran diuji sebelum tamu datang.', 'Cameras, the frame and the modem are set up and the stream is tested before guests arrive.')),
          (('Saat acara', 'During the event'), ('Siaran langsung', 'Live'), ('Momen demi momen disiarkan, sementara live cam menampilkannya di layar gedung.', 'Moment by moment it goes out live, while the live cam shows it on the venue screens.')),
          (('Setelah acara', 'After the event'), ('Rekaman diserahkan', 'Recording handed over'), ('Rekaman penuh kami kirim kepada kalian.', 'We send you the full recording.')),
          (('Selamanya', 'For good'), ('Kenangan yang bisa diputar ulang', 'A memory to replay'), ('Bagikan kepada keluarga yang belum sempat menonton.', 'Share it with family who could not watch at the time.')),
        ]), glass=False)
    def incl_b(B):
        return S(sec_head(('Yang termasuk.', 'What is included.')) + incl([
          (('Kru kamera dan operator siaran', 'Camera crew and broadcast operator'),), (('Kamera bergerak', 'Moving cameras'),),
          (('Bingkai siaran sesuai tema', 'A themed broadcast frame'),), (('Siaran ke YouTube atau Instagram, dan platform lain sesuai kebutuhan', 'Streaming to YouTube or Instagram, and other platforms as needed'),),
          (('Live cam ke layar gedung', 'Live cam to the venue screen'),), (('Modem internet khusus', 'Dedicated internet modem'),),
          (('Rekaman penuh', 'Full recording'),), (('Tautan siaran di undangan', 'The stream link in the invitation'),),
          (('Pertemuan teknis dan uji siaran', 'Technical meeting and a test broadcast'),), (('Pendamping khusus dan layanan 24 jam', 'A dedicated companion and 24-hour service'),),
        ]) + T(('Lama siaran, jumlah kamera, dan jumlah kru kami sesuaikan dengan acara kalian. Live streaming bisa dipesan bersama undangan digital dan buku tamu dalam satu pesanan. Pembayaran dilunasi sebelum hari acara.',
                'Broadcast length, the number of cameras and the crew size are set for your event. Live streaming can be booked with the digital invitation and guestbook in one order. Payment is made in full before the event.'), 'p', 'note'))
    def faq_b(B):
        return S(sec_head(('Pertanyaan tentang live streaming.', 'Questions about live streaming.')) + qs('platform', 'siapa', 'rekaman', 'internet', 'terpisah', 'bayar')
                 + f'<p class="note"><a href="{B}faq/" data-en="See every question">Lihat semua pertanyaan</a></p>')
    return [feats_b, day_b, incl_b, faq_b]
PRODUCT_COPY['live-streaming']['blocks'] = _ls_blocks()

# Persiapan --------------------------------------------------------------------
PRODUCT_COPY['persiapan'] = dict(
 title=('Persiapan pernikahan bersama Nawala', 'Wedding planning with Nawala'),
 desc=('Ruang perencanaan pernikahan bersama tim Nawala: WBS, kanban, gantt, anggaran (RAB) dengan tahap bayar, vendor, rundown, rapat, persetujuan, berkas, pengingat, obrolan, dan denah kursi.', ''),
 h1=('Satu ruang untuk merencanakan semuanya.', 'One room to plan everything.'),
 lead=('Daftar tugas di grup chat, anggaran di catatan ponsel, nomor vendor tercecer: semua itu pindah ke satu ruang yang kalian pakai bersama tim Nawala. Kalian selalu tahu apa yang sudah selesai, apa yang menunggu, dan berapa yang sudah dibayar.',
       'Tasks in a group chat, the budget in a phone note, vendor numbers everywhere: all of it moves into one room you share with the Nawala team. You always know what is done, what is waiting and how much has been paid.'),
 chips=[('WBS, kanban, gantt', 'WBS, kanban, gantt'), ('Anggaran dan tahap bayar', 'Budget and payment stages'), ('Obrolan dengan tim', 'Chat with the team'), ('Untuk semua tingkat tema', 'For every theme tier')],
 acts=[(('Coba demo Persiapan', 'Try the planning demo'), '../../ruang/?demo=persiapan')],
 wa=('Halo Nawala, saya ingin tahu tentang Persiapan pernikahan.', 'Hello Nawala, I would like to know about wedding planning.'),
 fig='hari', fignote=('Satu tautan melewati setiap langkah hari pernikahan.', 'One link passing every step of the wedding day.'),
 ajak=(('Rencanakan dengan tenang.', 'Plan with peace of mind.'), ('Mulai dengan undangan kalian, lalu aktifkan perencanaan penuh kapan saja. Tanyakan lewat WhatsApp.', 'Start with your invitation, then switch on full planning whenever you are ready. Ask us on WhatsApp.')),
)
def _pm_blocks():
    def layers_b(B):
        return S(sec_head(('Dua lapisan, satu ruang.', 'Two layers, one room.')) + '<div class="split">'
          + f'<article class="card" data-rise>{T(("Pengerjaan undangan", "The invitation work"), "h3")}<span class="n" data-en="Included in every booking">Termasuk di setiap pesanan</span>'
          + T(('Setiap langkah undangan kalian terlihat: memilih tema, mengisi data, foto, daftar tamu, pemeriksaan, revisi, sampai tayang dan hari H.', 'Every step of your invitation is visible: choosing the theme, details, photos, the guest list, checks, revisions, going live and the day itself.'), 'p') + '</article>'
          + f'<article class="card card--hi" data-rise>{T(("Perencanaan pernikahan penuh", "Full wedding planning"), "h3")}<span class="n" data-en="An add-on">Layanan tambahan</span>'
          + T(('Gedung, katering, rias, busana, dekorasi, dokumentasi, hiburan, seserahan, sampai administrasi pernikahan, lengkap dengan anggaran dan vendor, dikerjakan bersama tim kami.', 'Venue, catering, make-up, attire, decoration, photo and video, entertainment, seserahan and the paperwork, with budget and vendors, worked through with our team.'), 'p') + '</article></div>')
    def tools_b(B):
        return S(sec_head(('Alat yang biasanya dipakai tim proyek, dibuat mudah untuk pasangan.', 'The tools project teams use, made easy for couples.'),
                          ('Semua bekerja di ponsel maupun laptop, dalam dua bahasa, dan tersimpan di Nawala.', 'Everything works on a phone or a laptop, in two languages, and is kept with Nawala.')) + feats([
          ('centang', ('Ringkasan', 'Overview'), ('Sekilas: berapa hari lagi, tugas yang terlambat dan minggu ini, anggaran terpakai, dan pesan yang belum dibaca.', 'At a glance: days to go, overdue tasks and this week\'s, budget used and unread messages.')),
          ('pohon', ('Struktur pekerjaan (WBS)', 'Work breakdown (WBS)'), ('Semua pekerjaan dipecah bertingkat dan diberi nomor. Kemajuan dan anggaran tiap cabang dihitung otomatis dari isinya.', 'All the work, broken down in levels and numbered. Progress and budget for each branch add up on their own.')),
          ('kanban', ('Papan tugas (kanban)', 'Task board (kanban)'), ('Empat kolom: Belum, Dikerjakan, Ditinjau, Selesai. Geser kartu, saring per orang.', 'Four columns: To do, In progress, In review, Done. Move cards, filter by person.')),
          ('gantt', ('Garis waktu (gantt)', 'Timeline (gantt)'), ('Setiap pekerjaan pada garis waktu menuju hari H. Tarik untuk memindah atau memperpanjang; tanggal bisa dihitung ulang dari hari pernikahan.', 'Every task on a timeline to the day. Drag to move or stretch it; dates can be re-planned from the wedding day.')),
          ('uang', ('Anggaran (RAB)', 'Budget'), ('Rencana dan realisasi per kategori, tahap pembayaran, bukti bayar, dan siapa yang membayar. Bisa diunduh untuk Excel.', 'Planned and actual per category, payment stages, receipts and who pays. Downloadable for Excel.')),
          ('toko', ('Vendor', 'Vendors'), ('Direktori vendor rekanan Nawala ditambah vendor pilihan kalian sendiri, dengan kontak, status, dan catatan.', "Nawala's partner vendor directory plus your own vendors, with contacts, status and notes.")),
          ('jam', ('Rundown', 'Rundown'), ('Susunan acara menit demi menit, bisa disalin menjadi pesan WhatsApp untuk keluarga dan vendor.', 'The schedule minute by minute, copied as a WhatsApp message for family and vendors in one tap.')),
          ('rapat', ('Catatan rapat', 'Meeting notes'), ('Hasil setiap rapat tercatat, dan tindak lanjutnya langsung menjadi tugas.', 'Every meeting is written down, and its follow-ups become tasks at once.')),
          ('hadir', ('Persetujuan', 'Approvals'), ('Konsep, desain, dan anggaran menunggu persetujuan kalian di satu tempat.', 'Concepts, designs and budgets wait for your approval in one place.')),
          ('berkas', ('Berkas dan moodboard', 'Files and moodboard'), ('Kontrak, kuitansi, inspirasi, dan foto referensi tersimpan bersama.', 'Contracts, receipts, inspiration and reference photos kept together.')),
          ('lonceng', ('Pengingat', 'Reminders'), ('Tugas yang jatuh tempo, pembayaran yang mendekat, dan persetujuan yang menunggu, bisa ditambahkan ke kalender ponsel.', 'Tasks coming due, payments drawing near and approvals waiting, all addable to your phone calendar.')),
          ('ucap', ('Obrolan dengan tim', 'Chat with the team'), ('Bicara dengan tim Nawala di dalam ruang, tanpa tenggelam di antara pesan lain.', 'Talk with the Nawala team inside the room, without getting lost among other messages.')),
          ('denah', ('Denah dan kursi', 'Floor plan and seats'), ('Susun ruangan dan dudukkan tamu, lalu terbitkan untuk tamu dan penerima tamu.', 'Lay out the room and seat your guests, then publish it for guests and ushers.')),
          ('tema', ('Memilih tema', 'Choosing a theme'), ('Simpan, saring, dan persempit tema sampai satu, lalu jadwalkan panggilan video.', 'Save, filter and narrow themes down to one, then book a video call.')),
          ('kuas', ('Editor desain', 'Design editor'), ('Sunting tampilan undangan dan kirim untuk diperiksa tim.', 'Edit how the invitation looks and send it for the team to check.')),
        ]))
    def privacy_b(B):
        return S(sec_head(('Siapa melihat apa.', 'Who sees what.')) + '<div class="split">'
          + f'<article class="card" data-rise>{T(("Kalian berdua", "The two of you"), "h3")}<ul>' + ''.join(T(x, 'li') for x in [
              ('Melihat dan mengubah semua tugas, anggaran, vendor, dan berkas yang dibagikan', 'See and change every shared task, budget line, vendor and file'),
              ('Menyetujui konsep, desain, dan anggaran', 'Approve concepts, designs and budgets'),
              ('Mengobrol dengan tim Nawala', 'Chat with the Nawala team'),
              ('Akses sampai 30 hari setelah pernikahan', 'Access until 30 days after the wedding')]) + '</ul></article>'
          + f'<article class="card" data-rise>{T(("Tim Nawala", "The Nawala team"), "h3")}<ul>' + ''.join(T(x, 'li') for x in [
              ('Mengelola seluruh rencana bersama kalian', 'Run the whole plan with you'),
              ('Menyimpan catatan internal yang tidak terlihat oleh pasangan', 'Keep internal notes the couple does not see'),
              ('Melihat jadwal semua pernikahan sekaligus agar tidak ada yang terlewat', 'See every wedding\'s schedule at once so nothing slips'),
              ('Setiap perubahan tercatat: siapa dan kapan', 'Every change is logged: who and when')]) + '</ul></article></div>')
    def demo_b(B):
        return S(f'''<div class="live"><div>{sec_head(('Masuk ke ruang Persiapan pasangan contoh.', "Step into the sample couple's planning room."), ('Laras dan Bima menikah tujuh bulan lagi. Lihat papan tugas, garis waktu, anggaran dengan tahap bayar, vendor, rundown, dan obrolan mereka dengan tim. Tidak ada yang tersimpan.', 'Laras and Bima marry in seven months. See their task board, timeline, budget with payment stages, vendors, rundown and their chat with the team. Nothing is saved.'))}
          <div class="head__acts">{link_btn(('Buka demo Persiapan', 'Open the planning demo'), B + 'ruang/?demo=persiapan', cls='btn btn--glow', lang=True)}{link_btn(('Demo memilih tema', 'Theme-choosing demo'), B + 'ruang/?demo=tema', lang=True)}</div></div>
          {stage('susun', ('Meja diletakkan, lalu tamu didudukkan.', 'A table is placed, then a guest is seated.'))}</div>''')
    def faq_b(B):
        return S(sec_head(('Pertanyaan tentang Persiapan.', 'Questions about Persiapan.')) + qs('pm', 'pmtambah', 'pmlihat', 'pmlama', 'pic', 'kode')
                 + f'<p class="note"><a href="{B}faq/" data-en="See every question">Lihat semua pertanyaan</a></p>')
    return [layers_b, tools_b, demo_b, privacy_b, faq_b]
PRODUCT_COPY['persiapan']['blocks'] = _pm_blocks()

# ---------- comparison (home and layanan/) ----------
COMPARE = [
 (('Undangan, buku tamu, live streaming, dan perencanaan dalam satu pesanan', 'Invitation, guestbook, live streaming and planning in one booking'), ('Ya, dengan satu pendamping', 'Yes, with one companion'), ('Sering dipesan terpisah, kadang di vendor berbeda', 'Often booked separately, sometimes from different vendors')),
 (('Ruang perencanaan: WBS, kanban, gantt, anggaran, vendor, rundown', 'A planning room: WBS, kanban, gantt, budget, vendors, rundown'), ('Ya, bersama tim', 'Yes, shared with the team'), ('Jarang; biasanya daftar tugas atau anggaran sederhana', 'Rare; usually a simple to-do list or budget')),
 (('Denah ruangan yang disusun sendiri, dilihat tamu dan penerima tamu', 'A floor plan you draw, seen by guests and ushers'), ('Ya', 'Yes'), ('Biasanya pengelompokan meja per kategori', 'Usually tables grouped by category')),
 (('Tema dunia yang bisa dimasuki, dengan film pembuka', 'World themes you walk into, with an opening film'), ('Ya, tingkat Premium ke atas', 'Yes, from Premium up'), ('Umumnya templat gulir dengan hiasan tempel', 'Mostly scrolling templates with stickers')),
 (('Tema yang hanya dimiliki satu pasangan', 'A theme owned by one couple only'), ('Ya, tingkat Eksklusif', 'Yes, the Exclusive tier'), ('Jarang', 'Rare')),
 (('Souvenir berbeda per kelompok tamu, dengan kode', 'Different souvenirs per guest group, by code'), ('Ya', 'Yes'), ('Jarang', 'Rare')),
 (('Album foto yang diisi semua tamu', 'One photo album filled by every guest'), ('Ya', 'Yes'), ('Jarang', 'Rare')),
 (('Dua bahasa penuh, tanpa terjemahan otomatis', 'Two full languages, no machine translation'), ('Ya, setiap teks', 'Yes, every line'), ('Sering bercampur atau diterjemahkan otomatis', 'Often mixed or machine-translated')),
]
COMPARE_NOTE = ('Perbandingan umum berdasarkan pengamatan kami atas layanan undangan digital di Indonesia pada November 2026. Setiap penyedia berbeda; tanyakan langsung untuk kebutuhan kalian.',
                'A general comparison based on our own look at digital invitation services in Indonesia in November 2026. Every provider differs; ask about your own needs.')
def compare_table(cls='tbl'):
    SR = 'scope="row"'
    rows = ''.join(f'<tr>{T(a, "th", attrs=SR)}{T(b, "td")}{T(c, "td")}</tr>' for a, b, c in COMPARE)
    return (f'<div class="scroll-x"><table class="{cls}"><thead><tr><th scope="col" data-en="What you get">Yang kalian dapatkan</th><th scope="col">Nawala</th>'
            f'<th scope="col" data-en="Typical digital invitations">Undangan digital pada umumnya</th></tr></thead><tbody>{rows}</tbody></table></div>')

def page_layanan():
    B = '../'
    out = head(B, 'Layanan Nawala', 'Undangan digital, buku tamu digital, live streaming, dan persiapan pernikahan dalam satu platform.', 'Nawala services')
    out += topbar(B) + '<main id="isi">\n'
    out += f'''<section class="head"><div class="wrap">{crumb(B, [(None, ('Layanan', 'Services'))])}
  <h1 data-en="Everything for the wedding day, on one platform.">Semua kebutuhan hari pernikahan, dalam satu platform.</h1>
  {T(('Pesan satu layanan atau semuanya sekaligus. Satu pendamping dari tim Nawala menemani kalian dari undangan pertama sampai tamu terakhir pulang.', 'Book one service or all of them at once. One companion from the Nawala team stays with you from the first invitation to the last guest going home.'), 'p', 'head__lead')}
  <div class="head__acts">{wa_btn(('Pesan sekarang', 'Book now'), WA_BOOK)}{link_btn(('Coba demo gratis', 'Try a free demo'), B + '?buka=demo')}</div></div></section>
'''
    cards = ''
    for s, ic, n, d in PRODUCTS:
        cards += f'<a class="post" href="{s}/" data-rise>{icon(ic)}{T(n, "h3")}{T(d, "p")}<i data-en="Read more">Pelajari selengkapnya</i></a>'
    out += S(f'<div class="posts">{cards}</div>', glass=False)
    out += S(sec_head(('Apa bedanya dengan undangan digital lain?', 'How is this different from other digital invitations?')) + compare_table('tbl tbl--cmp') + T(COMPARE_NOTE, 'p', 'note'))
    out += ajak(B, ('Ceritakan pernikahan kalian.', 'Tell us about your wedding.'), ('Kami bantu memilih layanan yang benar-benar kalian perlukan, tidak lebih.', 'We help you choose the services you actually need, nothing more.'))
    out += '</main>\n' + footer(B) + scripts(B)
    return out

# ---------- FAQ page ----------
FAQ_GROUPS = [
 ('umum', ('Pemesanan dan pembayaran', 'Booking and payment'), ['pesan', 'konsultasi', 'harga', 'bayar', 'kapan', 'pic', 'kode', 'tema', 'acaralain']),
 ('undangan', ('Undangan digital', 'Digital invitation'), ['nol', 'imajinasi', 'revisi', 'kirim', 'blokir', 'terpisah', 'sandi', 'selamanya', 'aplikasi', 'bahasa']),
 ('buku-tamu', ('Buku tamu digital', 'Digital guestbook'), ['masuk', 'tanpaqr', 'internet', 'kru', 'takdiundang', 'transport', 'rsvpasisten']),
 ('streaming', ('Live streaming', 'Live streaming'), ['platform', 'siapa', 'rekaman']),
 ('persiapan', ('Persiapan pernikahan', 'Wedding planning'), ['pm', 'pmtambah', 'pmlihat', 'pmlama']),
 ('data', ('Data dan privasi', 'Data and privacy'), ['data']),
]
CAT_OF = {k: g for g, _, keys in FAQ_GROUPS for k in keys}

def page_faq():
    B = '../'
    out = head(B, 'Pertanyaan umum, Nawala', 'Jawaban atas pertanyaan tentang undangan digital, buku tamu, live streaming, persiapan pernikahan, pembayaran, dan data di Nawala.', 'Questions, Nawala')
    out += topbar(B, 'faq') + '<main id="isi">\n'
    groups = ''.join(f'<div class="qa__group" id="{k}" data-group="{k}">{T(t, "h2")}{qs(*keys)}</div>' for k, t, keys in FAQ_GROUPS)
    out += S(f'<div class="tanya" data-tanya="page">{tanya_tools(True)}{groups}{tanya_none()}</div>')
    out += ajak(B, ('Siap memulai?', 'Ready to begin?'), ('Ceritakan tanggal dan rencana kalian. Kami membalas lewat WhatsApp.', 'Tell us your date and plans. We reply on WhatsApp.'))
    out += '</main>\n' + footer(B) + scripts(B)
    return out

# ---------- partnership ----------
def page_mitra():
    B = '../'
    msg = ('Halo Nawala, saya ingin menjadi mitra Nawala di kota saya.', 'Hello Nawala, I would like to become a Nawala partner in my city.')
    out = head(B, 'Kemitraan Nawala', 'Jadi mitra Nawala di kota kalian: komisi tetap per kategori, satu mitra satu kota, tanpa modal, tanpa target bulanan.', 'Nawala partnership')
    out += topbar(B) + '<main id="isi">\n'
    out += f'''<section class="head"><div class="wrap">{crumb(B, [(None, ('Kemitraan', 'Partnership'))])}
  <h1 data-en="Become Nawala's partner in your city.">Jadi mitra Nawala di kota kalian.</h1>
  {T(('Kenalkan pasangan yang akan menikah kepada Nawala dan dapatkan komisi dari setiap pesanan. Semakin banyak pasangan yang kalian bawa, semakin besar komisinya.', 'Introduce engaged couples to Nawala and earn a commission on every booking. The more couples you bring, the higher your commission.'), 'p', 'head__lead')}
  <div class="head__acts">{wa_btn(('Daftar jadi mitra', 'Apply to be a partner'), msg)}</div></div></section>
'''
    out += S(sec_head(('Mengapa bermitra dengan Nawala.', 'Why partner with Nawala.')) + feats([
      ('platform', ('Platform yang lengkap', 'A complete platform'), ('Undangan, buku tamu, live streaming, dan perencanaan dalam satu pesanan. Kalian menawarkan satu solusi, bukan empat vendor.', 'Invitation, guestbook, live streaming and planning in one booking. You offer one answer, not four vendors.')),
      ('uang', ('Komisi tetap per kategori', 'A fixed commission per category'), ('Persentase yang jelas untuk setiap produk yang terjual, dihitung dari harga sebelum pajak.', 'A clear percentage for every product sold, calculated on the price before tax.')),
      ('kota', ('Satu mitra, satu kota', 'One partner per city'), ('Kami hanya memilih satu mitra di setiap kota, sehingga kalian tidak bersaing dengan mitra Nawala lain.', 'We choose only one partner in each city, so you never compete with another Nawala partner.')),
      ('perisai', ('Tanpa modal', 'No capital needed'), ('Bergabung gratis. Kalian tidak perlu membeli stok atau membayar biaya pendaftaran.', 'Joining is free. No stock to buy, no sign-up fee.')),
      ('jam', ('Tanpa target bulanan', 'No monthly targets'), ('Kalian menentukan sendiri seberapa aktif ingin bermitra.', 'You decide how active you want to be.')),
      ('orang', ('Didampingi tim', 'Backed by the team'), ('Materi promosi, akses demo, dan satu kontak di tim Nawala untuk setiap pertanyaan pasangan kalian.', "Promotional material, demo access, and one contact in the Nawala team for every question your couples have.")),
    ]))
    SR = 'scope="row"'
    rows = ''.join(f'<tr>{T(a, "th", attrs=SR)}<td class="num">{b}</td></tr>' for a, b in [
        (('Undangan digital', 'Digital invitation'), '15&ndash;25%'), (('Buku tamu digital', 'Digital guestbook'), '12&ndash;17%'), (('Live streaming', 'Live streaming'), '10&ndash;15%')])
    out += S(sec_head(('Komisi per kategori.', 'Commission per category.'), ('Besarnya naik bertingkat sesuai jumlah pasangan yang kalian bawa setiap bulan. Rincian tingkatnya kami kirim saat perkenalan.', 'It rises in tiers with the number of couples you bring each month. We send the tier details when we first talk.'))
             + f'<div class="scroll-x"><table class="tbl"><thead><tr><th scope="col" data-en="Product">Produk</th><th scope="col" data-en="Commission">Komisi</th></tr></thead><tbody>{rows}</tbody></table></div>'
             + T(('Komisi dihitung dari harga sebelum PPN.', 'Commission is calculated on the price before VAT.'), 'p', 'note'))
    out += S(sec_head(('Cara bergabung.', 'How to join.')) + steps([
      (('Daftar lewat WhatsApp', 'Apply on WhatsApp'), ('Ceritakan kota kalian dan pengalaman kalian di dunia pernikahan.', 'Tell us your city and your experience in weddings.'), None),
      (('Perkenalan', 'An introduction'), ('Panggilan video singkat untuk saling mengenal dan membahas tingkat komisi.', 'A short video call to get to know each other and go over the commission tiers.'), None),
      (('Materi dan kode mitra', 'Material and partner code'), ('Kami kirim materi promosi, akses demo, dan kode mitra untuk mencatat pasangan yang kalian bawa.', 'We send promotional material, demo access and a partner code that records the couples you bring.'), None),
      (('Mulai', 'Begin'), ('Kenalkan Nawala kepada pasangan; kami yang melayani mereka sampai hari H.', 'Introduce Nawala to couples; we look after them through to the day.'), None),
    ]))
    out += S(sec_head(('Pertanyaan tentang kemitraan.', 'Questions about the partnership.')) + qa([
      (('Siapa yang bisa menjadi mitra?', 'Who can become a partner?'), ('Vendor pernikahan seperti wedding organizer, rias, dekorasi, dan fotografer sangat cocok, tetapi perorangan tanpa latar vendor juga bisa bergabung.', 'Wedding vendors such as organisers, make-up artists, decorators and photographers fit well, but individuals without a vendor background can join too.')),
      (('Apakah ada syarat khusus?', 'Are there any requirements?'), ('Kalian tidak sedang bermitra dengan penyedia undangan digital, buku tamu, atau live streaming lain yang serupa.', 'You are not partnered with another provider of similar digital invitations, guestbooks or live streaming.')),
      (('Apakah ada target penjualan?', 'Is there a sales target?'), ('Tidak ada. Kalian menentukan target sendiri.', 'None. You set your own.')),
      (('Bagaimana komisi dihitung?', 'How is commission calculated?'), ('Persentase tetap per kategori produk, dari harga sebelum PPN, dan naik bertingkat sesuai jumlah pasangan per bulan.', 'A fixed percentage per product category, on the price before VAT, rising in tiers with the number of couples per month.')),
    ]))
    out += ajak(B, ('Bawa Nawala ke kota kalian.', 'Bring Nawala to your city.'), ('Tempat mitra di setiap kota terbatas satu. Daftar sekarang lewat WhatsApp.', 'Each city has room for one partner. Apply now on WhatsApp.'), msg)
    out += '</main>\n' + footer(B) + scripts(B)
    return out

# ---------- the art contest (owner, 23 Nov 2026, points 9 and 10; his answers 18:04) ----------
def page_sayembara():
    B = '../'
    msg = ('Halo Nawala, saya ingin ikut Sayembara Nawala.', 'Hello Nawala, I would like to join the Nawala contest.')
    out = head(B, 'Sayembara Nawala', 'Sayembara karya seni untuk tema undangan Nawala: 20% untuk karya tangan, 5% untuk karya AI, setiap kali tema dipakai, selama dua tahun dan bisa diperpanjang.', 'The Nawala art contest')
    out += topbar(B) + '<main id="isi">\n'
    out += f'''<section class="head"><div class="wrap">{crumb(B, [(None, ('Sayembara Nawala', 'The Nawala contest'))])}
  <h1 data-en="Your art, in wedding invitations across Indonesia.">Karya kalian, di undangan pernikahan seluruh Indonesia.</h1>
  {T(('Nawala mencari lukisan dan ilustrasi untuk tema undangan pernikahan. Karya yang kami terima menjadi tema di katalog Nawala, dengan nama kalian di dalamnya, dan setiap kali pasangan memakai tema itu, kalian menerima bagiannya.', 'Nawala is looking for paintings and illustrations for wedding invitation themes. Work we accept becomes a theme in the Nawala catalogue, with your name in it, and every time a couple uses that theme you receive your share.'), 'p', 'head__lead')}
  <div class="head__acts">{wa_btn(('Daftar lewat WhatsApp', 'Sign up on WhatsApp'), msg)}</div>
  <div class="head__chips"><span class="chip"><i></i><span data-en="Open to anyone">Terbuka untuk siapa saja</span></span><span class="chip"><i></i><span data-en="Open until we close it">Dibuka sampai kami tutup</span></span><span class="chip"><i></i><span data-en="No entry fee">Tanpa biaya pendaftaran</span></span></div></div></section>
'''
    track = lambda pct, name, sub, items: (f'<article class="card" data-rise><b class="say-pct">{pct}</b>{T(name, "h3")}{T(sub, "p")}<ul>' + ''.join(T(x, 'li') for x in items) + '</ul></article>')
    out += S(sec_head(('Dua jalur, dua bagian.', 'Two tracks, two shares.'), ('Karya tangan dan karya AI dinilai di jalur yang terpisah, dengan bagian yang berbeda. Kerja tangan kami hargai lebih tinggi.', 'Hand-made and AI-made work are judged on separate tracks, with different shares. We value handwork more highly.'))
        + '<div class="split">'
        + track('20%', ('Karya tangan', 'Hand-made'), ('Dilukis, digambar, atau dibuat digital oleh kalian sendiri, tanpa gambar buatan AI di bagian mana pun.', 'Painted, drawn or made digitally by you, with no AI-generated image in any part of it.'),
                [('Cat air, guas, tinta, pastel, cat minyak, atau digital', 'Watercolour, gouache, ink, pastel, oil or digital'), ('Wajib menyertakan bukti proses', 'Proof of process is required'), ('20% dari bagian Nawala setiap undangan', "20% of Nawala's share of each invitation")])
        + track('5%', ('Karya AI', 'AI-made'), ('Dibuat dengan bantuan AI, lalu disusun utuh menjadi satu tema: lima adegan yang serasi, lapisan depan, dan hiasan bunga.', 'Made with the help of AI, then assembled into one complete theme: five matching scenes, front layers and a flower spray.'),
                [('Sebutkan alat dan perintah (prompt) yang dipakai', 'Name the tools and prompts used'), ('Kalian memastikan hak pakai atas hasilnya', 'You make sure you have the right to use the result'), ('5% dari bagian Nawala setiap undangan', "5% of Nawala's share of each invitation")])
        + '</div>', glass=False)
    SR = 'scope="row"'
    rows = ''.join(f'<tr>{T(a, "th", attrs=SR)}<td class="num">{b}</td><td class="num">{c}</td></tr>' for a, b, c in [
        (('Dijual langsung oleh Nawala', 'Sold directly by Nawala'), 'Rp100.000', 'Rp25.000'),
        (('Dijual lewat mitra dengan komisi 25%', 'Sold through a partner on 25% commission'), 'Rp75.000', 'Rp18.750')])
    out += S(sec_head(('Contoh hitungan.', 'A worked example.'), ('Untuk satu undangan seharga Rp500.000. Angka ini hanya contoh cara menghitung, bukan harga Nawala.', 'For one invitation at Rp500,000. This only shows how the share is counted; it is not a Nawala price.'))
        + f'<div class="scroll-x"><table class="tbl"><thead><tr><th scope="col" data-en="When the invitation is">Saat undangan</th><th scope="col" data-en="Hand-made (20%)">Karya tangan (20%)</th><th scope="col" data-en="AI-made (5%)">Karya AI (5%)</th></tr></thead><tbody>{rows}</tbody></table></div>'
        + T(('Bagian dihitung dari yang diterima Nawala: harga setelah komisi mitra dan pajak. Pembayaran dikirim setiap bulan lewat transfer bank, tanpa batas minimum, lengkap dengan rincian setiap undangan yang memakai karya kalian.', "The share is counted on what Nawala receives: the price after any partner commission and tax. Payment goes out every month by bank transfer, with no minimum, with a statement of every invitation that used your work."), 'p', 'note'))
    out += S(sec_head(('Cara ikut.', 'How to take part.')) + steps([
      (('Daftar', 'Sign up'), ('Kirim pesan lewat WhatsApp. Kami kirim berkas ketentuan dan ukuran gambar.', 'Send us a message on WhatsApp. We send the terms and the image sizes.'), ('Kalian', 'You')),
      (('Kirim karya', 'Send your work'), ('Kirim satu set tema: lima adegan, lapisan depan, dan satu hiasan bunga, bersama bukti proses atau keterangan alat AI.', 'Send one theme set: five scenes, front layers and one flower spray, with proof of process or the AI tools used.'), ('Kalian', 'You')),
      (('Dinilai tim Nawala', 'Reviewed by the Nawala team'), ('Tim kami menilai secara internal dan menjawab diterima atau belum, selalu dengan catatan. Tidak ada pemungutan suara publik.', 'Our team reviews it internally and answers accepted or not yet, always with notes. There is no public vote.'), ('Tim Nawala', 'Nawala team')),
      (('Dijadikan tema', 'Made into a theme'), ('Karya yang diterima kami bangun menjadi undangan yang berfungsi. Kalian melihat pratinjaunya dan menyetujuinya sebelum tayang.', 'Accepted work is built into a working invitation. You see the preview and approve it before it goes live.'), ('Tim Nawala dan kalian', 'Nawala team and you')),
      (('Tayang dan dibayar', 'Live and paid'), ('Tema masuk katalog dengan nama kalian. Setiap undangan yang memakainya tercatat, dan bagian kalian dikirim setiap bulan.', 'The theme enters the catalogue with your name. Every invitation that uses it is recorded, and your share is sent every month.'), None),
    ]))
    out += S(sec_head(('Yang perlu dikirim.', 'What to send.'), ('Ukuran ini mengikuti kerangka undangan Nawala, sehingga karya kalian langsung bisa dipakai di semua fitur: Ruang Imajinasi, editor desain, dan buku tamu.', "These sizes follow Nawala's invitation framework, so your work works at once with every feature: the Imagination Room, the design editor and the guestbook.")) + incl([
      (('Lima adegan tegak, 720 x 1290 piksel atau lebih besar', 'Five portrait scenes, 720 x 1290 pixels or larger'), ('Sampul, sapaan, acara, galeri, dan penutup; bagian tengah cukup tenang untuk tulisan', 'Cover, greeting, events, gallery and closing; calm enough in the middle for text')),
      (('Lapisan depan untuk tiap adegan', 'A front layer for each scene'), ('Bunga, daun, atau bentuk lain di bagian bawah, dengan latar transparan', 'Flowers, leaves or other forms along the bottom, on a transparent background')),
      (('Satu hiasan bunga terpisah', 'One separate flower spray'), ('Untuk sudut kartu, latar transparan', 'For card corners, on a transparent background')),
      (('Usulan palet warna', 'A suggested colour palette'),),
      (('Bukti proses (karya tangan)', 'Proof of process (hand-made)'), ('Sketsa, berkas berlapis, foto proses, atau rekaman layar', 'Sketches, layered files, process photos or a screen recording')),
      (('Keterangan alat dan perintah (karya AI)', 'Tools and prompts (AI-made)'),),
    ]))
    out += S(sec_head(('Ketentuan pokok.', 'The main terms.')) + qa([
      (('Siapa yang boleh ikut?', 'Who can take part?'), ('Siapa saja, pelajar maupun bukan, dari seluruh Indonesia. Peserta di bawah 18 tahun ikut dengan persetujuan orang tua atau wali.', 'Anyone, student or not, from anywhere in Indonesia. Entrants under 18 take part with the consent of a parent or guardian.')),
      (('Sampai kapan sayembara dibuka?', 'How long is the contest open?'), ('Sayembara selalu dibuka sampai kami umumkan ditutup. Karya bisa dikirim kapan saja.', 'It stays open until we announce that it has closed. Work can be sent at any time.')),
      (('Bagaimana karya dinilai?', 'How is work judged?'), ('Secara internal oleh tim Nawala. Setiap karya mendapat jawaban diterima atau belum, dengan catatan. Tidak ada juri publik dan tidak ada pemungutan suara.', 'Internally, by the Nawala team. Every entry gets an answer, accepted or not yet, with notes. There is no public jury and no vote.')),
      (('Berapa lama bagian saya berjalan?', 'How long does my share run?'), ('Dua tahun sejak tema tayang. Menjelang akhir masa itu kami bertanya apakah kalian ingin memperpanjang; bila tidak, tema itu kami pensiunkan.', 'Two years from when the theme goes live. Near the end of that time we ask whether you wish to renew; if not, the theme is retired.')),
      (('Apakah saya tetap memiliki karya saya?', 'Do I keep my work?'), ('Hak cipta tetap milik kalian. Nawala mendapat izin memakai karya itu sebagai tema undangan selama masa berlaku. Untuk tema Eksklusif, yang dijual kepada satu pasangan saja, izinnya eksklusif: karya itu tidak dipakai di tempat lain selama masa berlaku.', 'The copyright stays yours. Nawala receives a licence to use the work as an invitation theme while the term runs. For Exclusive themes, sold to one couple only, the licence is exclusive: the work is not used elsewhere while the term runs.')),
      (('Apakah boleh ada wajah manusia?', 'Can there be human faces?'), ('Tidak. Nawala tidak memakai wajah manusia, nyata maupun buatan. Nawala, surat bersayap kami, menggantikan pasangan di dalam gambar.', 'No. Nawala uses no human faces, real or generated. Nawala, our winged letter, stands in for the couple in the pictures.')),
      (('Bagaimana jika karya tangan ternyata dibuat dengan AI?', 'What if hand-made work turns out to be AI-made?'), ('Karya itu dipindahkan ke jalur AI atau ditarik dari katalog. Karena itu bukti proses wajib disertakan.', 'It is moved to the AI track or withdrawn from the catalogue. That is why proof of process is required.')),
      (('Kapan bagian saya dibayar?', 'When is my share paid?'), ('Setiap bulan lewat transfer bank, tanpa batas minimum, dengan rincian setiap undangan. Pajak mengikuti ketentuan yang berlaku.', 'Every month by bank transfer, with no minimum, with a statement of every invitation. Tax follows the rules in force.')),
    ]))
    out += ajak(B, ('Kirim karya pertama kalian.', 'Send your first work.'), ('Daftar lewat WhatsApp. Kami kirim ketentuan lengkap dan ukuran gambarnya.', 'Sign up on WhatsApp. We send the full terms and image sizes.'), msg)
    out += '</main>\n' + footer(B) + scripts(B)
    return out

# ---------- articles ----------
from kabar_isi import ARTICLES   # the starter articles live beside this file
from seni import ART             # the drawn illustrations for cards and articles

def page_kabar_index():
    B = '../'
    out = head(B, 'Kabar Nawala', 'Tips dan panduan pernikahan dari Nawala: undangan digital, denah meja, anggaran, dan live streaming.', 'Nawala journal')
    out += topbar(B, 'kabar') + '<main id="isi">\n'
    out += f'''<section class="head"><div class="wrap">{crumb(B, [(None, ('Kabar Nawala', 'Nawala journal'))])}
  <h1 data-en="Notes for a calmer wedding.">Catatan untuk pernikahan yang lebih tenang.</h1>
  {T(('Panduan praktis dari tim Nawala, dari mengirim undangan sampai menyusun anggaran.', 'Practical guides from the Nawala team, from sending invitations to planning the budget.'), 'p', 'head__lead')}</div></section>
'''
    cards = ''.join(f'<a class="post post--art" href="{a["slug"]}/" data-rise><span class="post__art">{ART[a["slug"]]("p-" + a["slug"])}</span>{T(a["kind"], "span", "k")}{T(a["title"], "h3")}{T(a["lead"], "p")}<i data-en="Read">Baca</i></a>' for a in ARTICLES)
    out += S(f'<div class="posts">{cards}</div>', glass=False)
    out += ajak(B, ('Butuh bantuan langsung?', 'Need a hand right away?'), ('Pendamping dari tim Nawala siap membantu lewat WhatsApp, 24 jam setiap hari.', 'A companion from the Nawala team is ready to help on WhatsApp, around the clock.'))
    out += '</main>\n' + footer(B) + scripts(B)
    return out

def page_article(a):
    B = '../../'
    out = head(B, a['title'][0] + ', Kabar Nawala', a['lead'][0], a['title'][1] + ', Nawala journal')
    out += topbar(B, 'kabar') + '<main id="isi">\n'
    body = ''
    for kind, val in a['body']:
        if kind == 'h': body += T(val, 'h2')
        elif kind == 'p': body += T(val, 'p')
        elif kind == 'ul': body += '<ul>' + ''.join(T(x, 'li') for x in val) + '</ul>'
    rel = a.get('rel')
    relb = ''
    if rel:
        s = {p[0]: p for p in PRODUCTS}[rel]
        relb = f'<p class="note"><span data-en="Related:">Terkait:</span> <a href="{B}layanan/{rel}/" data-en="{esc(s[2][1])}">{esc(s[2][0])}</a></p>'
    out += f'''<section class="head"><div class="wrap"><article class="art">{crumb(B, [(B + 'kabar/', ('Kabar Nawala', 'Nawala journal')), (None, a['kind'])])}
  <h1 data-en="{esc(a['title'][1])}">{esc(a['title'][0])}</h1>{T(a['lead'], 'p', 'head__lead')}
  <div class="art__meta">{T(a['kind'])}<span data-en="{esc(a['mins'][1])}">{esc(a['mins'][0])}</span><span data-en="Nawala team">Tim Nawala</span></div>
  <div class="art__body">{body}{relb}</div></article></div></section>
'''
    out += ajak(B, a['ajak'][0], a['ajak'][1])
    out += '</main>\n' + footer(B) + scripts(B)
    return out

# ---------- the home page's generated blocks ----------
def geser(head, cards, label, cls=''):
    """a row of big cards that scrolls sideways (assets/js/geser.js): heading on the left, arrows on the right,
    the row bleeding to the screen's edge, dots under it. Axis locked: a gesture that starts sideways moves only the cards."""
    arrows = ('<div class="geser__nav"><button type="button" class="geser__btn" data-dir="-1" aria-label="Sebelumnya" data-en-label="Previous">'
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button>'
              '<button type="button" class="geser__btn" data-dir="1" aria-label="Berikutnya" data-en-label="Next">'
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></div>')
    return (f'<div class="geser {cls}" data-geser><div class="geser__head">{head}{arrows}</div>'
            f'<div class="geser__track" tabindex="0" role="region" aria-roledescription="carousel" aria-label="{esc(label[0])}" data-en-label="{esc(label[1])}">{cards}</div>'
            '<p class="geser__count" aria-live="polite"><b>1</b> / <span></span></p></div>')

def home_blocks():
    """Blocks for index.html. Class names are prefixed lb- (styled in site.css, "Lembah") so they never meet the home page's own .card, .day or .phone."""
    B = ''
    blocks = {}
    cards = ''
    bullets = {
      'undangan-digital': [('Atas nama tiap tamu, revisi tanpa batas', "In each guest's name, unlimited revisions"), ('Kirim otomatis lewat WhatsApp', 'Automatic sending on WhatsApp'), ('Undangan terpisah, kata sandi, amplop digital', 'Split invitation, password, digital gift'), ('Editor desain seperti Canva', 'A design editor like Canva')],
      'buku-tamu-digital': [('Perangkat, modem, dan kru di lokasi', 'Devices, modem and crew on site'), ('Penerima tamu berseragam Nawala', 'Ushers in Nawala uniform'), ('Layar sapaan dan rekap kehadiran', 'Greeting screen and attendance report'), ('Denah meja dan souvenir per kelompok', 'Floor plan and souvenirs per group')],
      'live-streaming': [('Siaran sinematik, kamera bergerak', 'Cinematic, moving cameras'), ('YouTube, Instagram, TikTok, Zoom, Meet', 'YouTube, Instagram, TikTok, Zoom, Meet'), ('Live cam ke layar gedung', 'Live cam to the venue screen'), ('Rekaman penuh untuk kalian', 'The full recording is yours')],
      'persiapan': [('WBS, kanban, dan gantt', 'WBS, kanban and gantt'), ('Anggaran dengan tahap bayar', 'Budget with payment stages'), ('Vendor, rundown, rapat, berkas', 'Vendors, rundown, meetings, files'), ('Obrolan dengan tim Nawala', 'Chat with the Nawala team')],
    }
    bullets['rsvp-asisten'] = [('Tindak lanjut lewat chat dan telepon', 'Follow-up by chat and phone'), ('Kuota dan acara per tamu', 'Quota and events per guest'), ('Pengingat menjelang hari H', 'Reminders before the day'), ('Susunan meja dari jawaban', 'Tables arranged from the answers')]
    for s, ic, n, d in PRODUCTS:
        ul = '<ul>' + ''.join(T(b, 'li') for b in bullets[s]) + '</ul>'
        cards += (f'<article class="lb-prod geser__card" data-rasa><div class="lb-art">{ART[s]("a-" + s)}</div><div class="lb-prod__in">{T(n, "h3")}{T(d, "p")}{ul}'
                  f'<a class="btn btn--glass" href="layanan/{s}/" data-en="Read more">Pelajari selengkapnya</a></div></article>')
    figs = [('tema', f'{N["tema"]}', ('tema dalam empat tingkat', 'themes in four tiers'), ('ratusan', 'hundreds')),
            ('surat', f'{N["contoh"]}', ('undangan contoh siap dibuka', 'sample invitations to open'), ('puluhan', 'dozens')),
            ('platform', f'{N["dunia"]}', ('dunia Premium yang bisa dimasuki', 'Premium worlds to walk into'), None),
            ('demo', f'{N["demo"]}', ('demo langsung tanpa daftar', 'live demos, no sign-up'), None)]
    nums = ''
    for k, n, label, kira in figs:
        val = n if (MODE == 'pasti' or not kira) else kira[0]
        val_en = n if (MODE == 'pasti' or not kira) else kira[1]
        nums += f'<div class="lb-num">{icon(k, "lb-ic")}<b data-en="{val_en}">{val}</b>{T(label)}</div>'
    blocks['platform'] = geser(
        '<div class="lb-head">' + T(('Satu platform untuk seluruh pernikahan.', 'One platform for the whole wedding.'), 'h2')
        + T(('Undangan hanyalah awalnya. Pesan satu layanan atau semuanya sekaligus, dengan satu pendamping dari tim Nawala dari undangan pertama sampai tamu terakhir pulang.', 'The invitation is only the beginning. Book one service or all of them at once, with one companion from the Nawala team from the first invitation to the last guest going home.'), 'p') + '</div>',
        cards, ('Lima layanan Nawala', 'The five Nawala services')) + f'<div class="wrap"><div class="lb-nums">{nums}</div></div>'
    # the contest band (owner, 23 Nov 2026, points 3 and 10): deep rose, the venue photo fading in from the right,
    # credited in its corner and linking to its article (rights not cleared: developer mode, owner to settle)
    PJ = 'https://www.passionjewelry.co.id/news-detail/7-tips-memilih-wedding-organizer-terbaik-untuk-hari-pernikahanmu'
    PJI = 'https://www.passionjewelry.co.id/uploads/7-tips-memilih-wedding-organizer-terbaik-untuk-hari-pernikahanmu-359-2020-12-30-140411.jpg'
    tracks = (f'<div class="lb-say__track"><b>20%</b>{T(("Karya tangan", "Hand-made"), "span", "n")}{T(("Dilukis, digambar, atau dibuat digital oleh kalian sendiri, tanpa AI.", "Painted, drawn or made digitally by you, without AI."), "span")}</div>'
              f'<div class="lb-say__track"><b>5%</b>{T(("Karya AI", "AI-made"), "span", "n")}{T(("Dibuat dengan bantuan AI, disusun utuh menjadi satu tema.", "Made with AI, assembled into one complete theme."), "span")}</div>')
    blocks['udara'] = (
        f'<a class="lb-say__photo" href="{PJ}" target="_blank" rel="noopener" aria-label="Bacaan: 7 tips memilih wedding organizer, Passion Jewelry (tab baru)" data-en-label="Reading: 7 tips for choosing a wedding organiser, Passion Jewelry (new tab)">'
        f'<img src="{PJI}" width="1280" height="853" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">'
        '<span class="lb-say__news"><b data-en="7 tips for choosing the best wedding organiser">7 tips memilih wedding organizer terbaik</b><span data-en="Photo and article: Passion Jewelry">Foto dan artikel: Passion Jewelry</span></span></a>'
        '<div class="lb-say__in">'
        + T(('Karya kalian, di undangan pernikahan seluruh Indonesia.', 'Your art, in wedding invitations across Indonesia.'), 'h2')
        + T(('Sayembara Nawala mencari lukisan dan ilustrasi untuk tema undangan. Setiap kali pasangan memakai tema dari karya kalian, kalian menerima bagian dari undangan itu.', 'The Nawala contest is looking for paintings and illustrations for invitation themes. Every time a couple uses a theme made from your work, you receive a share of that invitation.'), 'p', 'lb-say__lead')
        + f'<div class="lb-say__tracks">{tracks}</div>'
        + T(('Dihitung dari bagian Nawala setiap undangan, selama dua tahun dan bisa diperpanjang. Terbuka untuk siapa saja, kapan saja.', "Counted on Nawala's share of each invitation, for two years and renewable. Open to anyone, any time."), 'p', 'lb-say__fine')
        + '<div class="lb-say__acts"><a class="btn btn--glow" href="sayembara/" data-en="Read the terms">Baca ketentuannya</a>'
        + wa_btn(('Daftar lewat WhatsApp', 'Sign up on WhatsApp'), ('Halo Nawala, saya ingin ikut Sayembara Nawala.', 'Hello Nawala, I would like to join the Nawala contest.'), 'btn btn--glass')
        + '</div></div>')
    blocks['cmp'] = ('<div class="wrap"><div class="lb-head">' + T(('Apa bedanya dengan undangan digital lain?', 'How is this different from other digital invitations?'), 'h2')
        + T(('Delapan hal yang kalian dapatkan di Nawala, dibandingkan dengan yang biasa ditemui di layanan undangan digital.', 'Eight things you get at Nawala, next to what digital invitation services usually offer.'), 'p')
        + '</div>' + compare_table('lb-tbl') + T(COMPARE_NOTE, 'p', 'lb-small') + '</div>')
    pk = [
      ('surat', ('Undangan digital', 'Digital invitation'), ('Dasar, Premium, Eksklusif, atau Kustom', 'Basic, Premium, Exclusive or Custom'),
       [('Undangan atas nama tiap tamu, tanpa batas', "Invitations in each guest's name, no limit"), ('Kirim otomatis lewat WhatsApp', 'Automatic sending on WhatsApp'), ('RSVP, ucapan, amplop digital', 'RSVP, wishes, digital gift'), ('Kuota dan acara per tamu', 'Quota and events per guest'), ('Editor desain, revisi tanpa batas', 'Design editor, unlimited revisions')], 'undangan', False),
      ('qr', ('Buku tamu digital', 'Digital guestbook'), ('Untuk hari H, di lokasi', 'For the day, on site'),
       [('Tablet, printer label, dan modem', 'Tablets, label printer and a modem'), ('Penerima tamu berseragam, dengan tata rias', 'Uniformed ushers, make-up included'), ('Layar sapaan dan swafoto', 'Greeting screen and selfies'), ('Pencatatan kado, doorprize', 'Gift logging, doorprize'), ('Gratis transportasi di Bandung', 'Free transport in Bandung')], 'buku-tamu', False),
      ('telepon', ('Asisten RSVP', 'RSVP Assistance'), ('Kami yang menanyakan tamu', 'We ask your guests'),
       [('Skema berdiri atau duduk', 'Standing or seated scheme'), ('Tindak lanjut chat dan telepon', 'Chat and phone follow-up'), ('Pengingat hari H', 'Day reminders'), ('Susunan meja', 'Table arrangement')], 'rsvp', False),
      ('kamera', ('Live streaming', 'Live streaming'), ('Untuk yang tidak bisa hadir', 'For those who cannot come'),
       [('Siaran sinematik, kamera bergerak', 'Cinematic, moving cameras'), ('Bingkai sesuai tema', 'A frame to match the theme'), ('Banyak platform sekaligus', 'Several platforms at once'), ('Rekaman penuh', 'Full recording')], 'streaming', False),
      ('paket', ('Paket lengkap', 'The complete package'), ('Semuanya dalam satu pesanan', 'Everything in one booking'),
       [('Undangan digital dan Asisten RSVP', 'Digital invitation and RSVP Assistance'), ('Buku tamu digital', 'Digital guestbook'), ('Live streaming', 'Live streaming'), ('Persiapan pernikahan penuh bila diinginkan', 'Full wedding planning if you wish'), ('Satu pendamping untuk semuanya', 'One companion for all of it')], 'lengkap', True),
    ]
    cards = ''
    for ic, n, sub, items, key, hi in pk:
        ul = '<ul>' + ''.join(T(b, 'li') for b in items) + '</ul>'
        btn = f'<button type="button" class="btn {"btn--glow" if hi else "btn--glass"}" data-pintu="harga" data-paket="{key}" data-en="Ask the price">Tanya harga</button>'
        cards += f'<article class="lb-pack{" is-hi" if hi else ""}" data-rasa="kecil">{icon(ic, "lb-ic")}{T(n, "h3")}{T(sub, "p", "lb-sub")}{ul}{btn}</article>'
    blocks['paket'] = ('<div class="wrap"><div class="lb-head">' + T(('Pilih paket kalian.', 'Choose your package.'), 'h2')
        + T(('Harga mengikuti tingkat tema, layanan, jumlah tamu, dan kota acara. Isi data singkat sekali saja: daftar harga lengkap dan kode akses semua tema langsung kalian terima.', 'Prices follow the theme tier, the services, the number of guests and the city. Fill in a few details once: you receive the full price list and an access code to every theme.'), 'p')
        + f'</div><div class="lb-packs">{cards}</div><div class="lb-terms">'
        + '<p><b data-en="Every package:">Setiap paket:</b> <span data-en="a dedicated companion, 24-hour customer service on WhatsApp, and unlimited revisions.">pendamping khusus, layanan pelanggan 24 jam lewat WhatsApp, dan revisi tanpa batas.</span></p>'
        + '<p><b data-en="Payment:">Pembayaran:</b> <span data-en="in full before the event, by bank transfer. QRIS is coming soon.">dilunasi sebelum hari acara, lewat transfer bank. QRIS segera tersedia.</span></p>'
        + '<p><b data-en="Planning:">Persiapan:</b> <span data-en="the invitation work is in every booking; full wedding planning is an add-on.">pengerjaan undangan termasuk di setiap pesanan; perencanaan pernikahan penuh adalah layanan tambahan.</span> <a href="layanan/persiapan/" data-en="About Persiapan">Tentang Persiapan</a></p>'
        + '</div><p class="lb-free"><span data-en="Not sure yet?">Belum yakin?</span> <button type="button" class="btn btn--glass" data-pintu="konsultasi" data-en="Free consultation">Konsultasi gratis</button></p></div>')
    allk = [k for _, _, ks in FAQ_GROUPS for k in ks]
    blocks['faq'] = ('<div class="wrap"><div class="lb-head">' + T(('Pertanyaan yang sering ditanyakan.', 'Frequently asked questions.'), 'h2') + '</div>'
        + '<div class="tanya" data-tanya="home">' + tanya_tools()
        + qs(*allk, pop=('pesan', 'konsultasi', 'bayar', 'imajinasi', 'revisi', 'kirim', 'siapa', 'tema')).replace('class="qa"', 'class="lb-qa"')
        + tanya_none() + '</div><p class="lb-more"><a class="btn btn--glass" href="faq/" data-en="See every question">Lihat semua pertanyaan</a></p></div>')
    posts = ''.join(f'<a class="lb-post geser__card" href="kabar/{a["slug"]}/" data-rasa><span class="lb-art">{ART[a["slug"]]("k-" + a["slug"])}</span><span class="lb-post__in">{T(a["kind"], "span", "k")}{T(a["title"], "h3")}{T(a["lead"], "p")}</span></a>' for a in ARTICLES)
    blocks['kabar'] = geser('<div class="lb-head">' + T(('Kabar Nawala', 'Nawala journal'), 'h2') + T(('Panduan praktis dari tim Nawala, dari mengirim undangan sampai memilih tema.', 'Practical guides from the Nawala team, from sending invitations to choosing a theme.'), 'p')
                            + '<a class="btn btn--glass" href="kabar/" data-en="All articles">Semua tulisan</a></div>', posts, ('Tulisan Kabar Nawala', 'Nawala journal articles'))
    col1 = ''.join(f'<li><a href="layanan/{s}/" data-en="{esc(n[1])}">{esc(n[0])}</a></li>' for s, ic, n, d in PRODUCTS)
    blocks['foot'] = f'''
      <div class="foot__cols">
        <div>{T(('Layanan', 'Services'), 'h2')}<ul>{col1}<li><a href="tema/" data-en="Themes">Tema</a></li><li><a href="#paket" data-en="Packages">Paket</a></li></ul></div>
        <div>{T(('Bantuan', 'Help'), 'h2')}<ul><li><a href="faq/" data-en="Questions">Pertanyaan umum</a></li><li><a href="?buka=demo" data-open="demo" data-en="Try a demo">Coba demo</a></li><li><a href="mitra/" data-en="Partnership">Kemitraan</a></li><li><a href="sayembara/" data-en="Art contest">Sayembara karya</a></li><li><a href="kabar/" data-en="Nawala journal">Kabar Nawala</a></li></ul></div>
        <div>{T(('Layanan pelanggan', 'Customer service'), 'h2')}{T(('24 jam setiap hari lewat WhatsApp.', 'Around the clock, every day, on WhatsApp.'), 'p')}
          <h2 data-en="Payment">Pembayaran</h2><p class="foot__pay"><span data-en="Bank transfer">Transfer bank</span><span data-en="QRIS (soon)">QRIS (segera)</span></p></div>
      </div>
    '''
    return blocks

def write(path, text):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w') as f: f.write(text)

def main():
    for s, *_ in PRODUCTS:
        write(f'layanan/{s}/index.html', page_product(s))
    write('layanan/index.html', page_layanan())
    write('faq/index.html', page_faq())
    write('mitra/index.html', page_mitra())
    write('sayembara/index.html', page_sayembara())
    write('kabar/index.html', page_kabar_index())
    for a in ARTICLES:
        write(f'kabar/{a["slug"]}/index.html', page_article(a))
    # home page blocks
    p = os.path.join(ROOT, 'index.html'); s = open(p).read()
    for k, v in home_blocks().items():
        pat = re.compile(r'(<!-- gen:' + k + r' -->)(.*?)(<!-- /gen:' + k + r' -->)', re.S)
        if not pat.search(s): print('missing block', k, file=sys.stderr); continue
        s = pat.sub(lambda m: m.group(1) + v + '      ' + m.group(3), s)
    open(p, 'w').write(s)
    print('written')

if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()
