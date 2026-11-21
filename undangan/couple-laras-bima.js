/* One invitation = one file like this. It names the theme kit, the level, the wording and everything the couple told us.
   Text that guests read is written as [Indonesian, English].
   Laras & Bima are Nawala's sample couple: every name, date, place and number here is an illustration. */
window.NAWALA_INVITE = {
  sample: true,                 // shows the "Contoh" review button and the note at the end
  theme: 'umum',                // theme kit: umum, pendopo-jawa or akad-putih (theme-<id>.css; the kit brings its own opening film)
  level: 3,                     // 1 Dasar, 2 Menengah, 3 Maksimal
  wording: 'umum',              // 'umum' (neutral) or 'islam'
  whatsapp: '6281379211628',    // RSVP answers are sent here until the database exists
  sampleGuest: 'Bapak dan Ibu Santoso', // shown on the envelope when the link carries no ?to= name (samples only)

  bride: {
    short: 'Laras', full: 'Laras Ayuningtyas',
    parents: ['Putri pertama Bapak Hendra Wijaya dan Ibu Sari Wulandari', 'First daughter of Mr Hendra Wijaya and Mrs Sari Wulandari']
  },
  groom: {
    short: 'Bima', full: 'Bima Pradipta',
    parents: ['Putra kedua Bapak Agus Pradipta dan Ibu Ratna Dewi', 'Second son of Mr Agus Pradipta and Mrs Ratna Dewi']
  },

  date: '2027-06-12', utcOffset: 7, zone: 'WIB',
  events: [
    { kind: 'ceremony', start: '09:00', end: '10:30', place: 'Taman Nawala', address: 'Jalan Contoh No. 1, Bandung', map: 'https://www.google.com/maps/search/?api=1&query=Bandung' },
    { kind: 'reception', start: '11:00', end: '14:00', place: 'Taman Nawala', address: 'Jalan Contoh No. 1, Bandung', map: 'https://www.google.com/maps/search/?api=1&query=Bandung' }
  ],
  dress: {
    note: ['Kami senang bila tamu mengenakan warna lembut.', 'We would love our guests to wear soft colours.'],
    colours: [['#EFE6D2', 'Krem', 'Cream'], ['#A9C0A0', 'Hijau sage', 'Sage green'], ['#F3CBD6', 'Merah muda pucat', 'Pale pink']]
  },
  stream: { url: '', note: ['Tautan siaran aktif pada hari acara.', 'The stream link goes live on the day.'] },

  story: [
    { when: ['2019', '2019'], title: ['Bertemu', 'We met'], text: ['Satu kelompok tugas di kampus, dan satu payung saat hujan sore.', 'One study group on campus, and one umbrella in the afternoon rain.'] },
    { when: ['2023', '2023'], title: ['Berjalan bersama', 'Together'], text: ['Dua kota, banyak kereta, dan telepon yang tidak pernah singkat.', 'Two cities, many trains, and phone calls that were never short.'] },
    { when: ['2026', '2026'], title: ['Lamaran', 'The proposal'], text: ['Di depan kedua keluarga, kami sepakat memilih jalan yang sama.', 'In front of both families, we agreed to choose the same road.'] }
  ],

  gifts: [
    { bank: 'Bank Contoh', number: '0000 1234 5678', name: 'Laras Ayuningtyas' },
    { bank: 'Dompet Digital Contoh', number: '0812 0000 0000', name: 'Bima Pradipta' }
  ],
  giftAddress: ['Jalan Contoh No. 1, Bandung 40111', 'Jalan Contoh No. 1, Bandung 40111'],

  wishes: [
    { name: 'Dinda', text: ['Selamat untuk kalian berdua. Semoga rumahnya selalu ramai tawa.', 'Congratulations to you both. May your home always be full of laughter.'] },
    { name: 'Keluarga Santoso', text: ['Turut berbahagia. Sampai bertemu di hari bahagia.', 'So happy for you. See you on the happy day.'] },
    { name: 'Raka dan Tia', text: ['Akhirnya. Kami menunggu undangan ini sejak 2019.', 'At last. We have been waiting for this invitation since 2019.'] }
  ],

  /* the kit's own instrumental (60 s, loops, about 0.7 MB) */
  music: { src: '../assets/audio/nawala-umum.mp3' }
};
