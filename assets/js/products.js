/*
  BRKX catalog. Edit this file to add, remove or reprice products.
  See README.md for a short guide.

  price      number in JOD (13.5 = 13.5 دينار)
  category   id from CATEGORIES below. A new category appears as a filter
             automatically once a product uses it.
  sizes      array, or null for products without sizes (accessories, perfume...)
  colours    variants. Each needs img (card image) and may have alt (second
             image) and video. For a product with one variant, give one entry.
  hero       true to feature it in the rotating hero at the top.
  films      clips/photos shown in the looks rail; colour links to a variant.
*/
window.BRKX_STORE = {
  phone: '962796673484',
  delivery: 1.75,            // JOD, flat, every order, all governorates
  sizesDefault: ['M', 'L', 'XL', 'XXL'],

  categories: [
    { id: 'knitwear',    ar: 'بلايز',        en: 'Knitwear' },
    { id: 'accessories', ar: 'إكسسوارات',    en: 'Accessories' },
    { id: 'other',       ar: 'منتجات أخرى',  en: 'More' }
  ],

  products: [
    {
      id: 'henley',
      category: 'knitwear',
      name:    { ar: 'بلوزة هنلي oversize', en: 'Oversize Henley' },
      title:   { ar: ['بلـوزة هنلي', 'oversize.'], en: ['The oversize', 'Henley.'] },
      tagline: { ar: 'بلوزة محبوكة بياقة وأزرار، وقصّة واسعة.', en: 'Knit sweater with a buttoned collar and a loose fit.' },
      price: 13.5,
      sizes: ['M', 'L', 'XL', 'XXL'],
      hero: { video: 'assets/video/qusai-720.mp4', videoSmall: 'assets/video/qusai-480.mp4', poster: 'assets/img/poster-qusai.webp' },
      specs: [
        { ar: 'قماش محبوك', en: 'Knitted' },
        { ar: 'ياقة بأزرار', en: 'Buttoned collar' },
        { ar: 'كم طويل', en: 'Long sleeves' },
        { ar: 'قصّة واسعة', en: 'Loose fit' }
      ],
      colours: [
        { id: 'indigo',   ar: 'أزرق', en: 'Blue', hex: '#5B6E9E', img: 'assets/img/polo-indigo-640.webp',   imgLarge: 'assets/img/polo-indigo-1100.webp',   alt: 'assets/img/look-indigo-900.webp' },
        { id: 'charcoal', ar: 'رمادي غامق',  en: 'Dark Grey',      hex: '#5F646C', img: 'assets/img/polo-charcoal-640.webp', imgLarge: 'assets/img/polo-charcoal-1100.webp', alt: 'assets/img/look-charcoal-900.webp' },
        { id: 'espresso', ar: 'بني', en: 'Brown',      hex: '#4B2F23', img: 'assets/img/polo-espresso-640.webp', imgLarge: 'assets/img/polo-espresso-1100.webp', alt: 'assets/img/look-espresso-900.webp' },
        { id: 'rose',     ar: 'زهري',  en: 'Pink',    hex: '#A7707B', img: 'assets/img/polo-rose-640.webp',     imgLarge: 'assets/img/polo-rose-1100.webp',     alt: 'assets/img/look-rose-900.webp' }
      ],
      films: [
        { video: 'assets/video/detail-720.mp4', poster: 'assets/img/poster-detail.webp', colour: 'charcoal' },
        { image: 'assets/img/look-rose-900.webp', colour: 'rose' },
        { video: 'assets/video/rack-720.mp4', poster: 'assets/img/poster-rack.webp', colour: 'indigo' }
      ]
    },
    {
      id: 'crew',
      category: 'knitwear',
      badge:   { ar: 'جديد', en: 'New' },
      name:    { ar: 'بلوزة القبة المدورة', en: 'Crew-neck Cable Knit' },
      title:   { ar: ['بلوزة القبة', 'المـدورة.'], en: ['The crew-neck', 'cable knit.'] },
      tagline: { ar: 'بلوزة محبوكة مجدولة بقبة مدورة.', en: 'Cable-knit sweater with a round neck.' },
      price: 14.5,
      sizes: ['M', 'L', 'XL', 'XXL'],
      hero: { clips: ['charcoal', 'beige', 'cream', 'lightgrey'] },
      specs: [
        { ar: 'نقشة مجدولة', en: 'Cable knit' },
        { ar: 'قبة مدورة', en: 'Round neck' },
        { ar: 'كم طويل', en: 'Long sleeves' },
        { ar: 'شعار صغير على الصدر', en: 'Small logo on the chest' }
      ],
      colours: [
        { id: 'charcoal',  ar: 'رمادي غامق', en: 'Dark Grey',   hex: '#4B4C55', img: 'assets/img/crew-charcoal-640.webp',  imgLarge: 'assets/img/crew-charcoal-1080.webp',  alt: 'assets/img/crew-charcoal-alt-640.webp',  video: 'assets/video/crew-charcoal.mp4',  poster: 'assets/img/poster-crew-charcoal.webp' },
        { id: 'beige',     ar: 'بيج',        en: 'Beige',      hex: '#C9B08E', img: 'assets/img/crew-beige-640.webp',     imgLarge: 'assets/img/crew-beige-1080.webp',     alt: 'assets/img/crew-beige-alt-640.webp',     video: 'assets/video/crew-beige.mp4',     poster: 'assets/img/poster-crew-beige.webp' },
        { id: 'cream',     ar: 'سكري',       en: 'Off-white',      hex: '#F1ECDF', img: 'assets/img/crew-cream-640.webp',     imgLarge: 'assets/img/crew-cream-1080.webp',     alt: 'assets/img/crew-cream-alt-640.webp',     video: 'assets/video/crew-cream.mp4',     poster: 'assets/img/poster-crew-cream.webp' },
        { id: 'lightgrey', ar: 'رمادي فاتح', en: 'Light Grey', hex: '#B9B5B4', img: 'assets/img/crew-lightgrey-640.webp', imgLarge: 'assets/img/crew-lightgrey-1080.webp', alt: 'assets/img/crew-lightgrey-alt-640.webp', video: 'assets/video/crew-lightgrey.mp4', poster: 'assets/img/poster-crew-lightgrey.webp' }
      ],
      films: [
        { video: 'assets/video/crew-charcoal.mp4',  poster: 'assets/img/poster-crew-charcoal.webp',  colour: 'charcoal' },
        { video: 'assets/video/crew-beige.mp4',     poster: 'assets/img/poster-crew-beige.webp',     colour: 'beige' },
        { video: 'assets/video/crew-cream.mp4',     poster: 'assets/img/poster-crew-cream.webp',     colour: 'cream' },
        { video: 'assets/video/crew-lightgrey.mp4', poster: 'assets/img/poster-crew-lightgrey.webp', colour: 'lightgrey' }
      ]
    },
    {
      id: 'dmc',
      category: 'knitwear',
      badge:   { ar: 'ترند الموسم', en: 'Trend of the season' },
      name:    { ar: 'بلوزة DMC', en: 'DMC Sweater' },
      title:   { ar: ['بلوزة DMC', 'صوف مجـدول.'], en: ['The DMC', 'sweater.'] },
      tagline: { ar: 'بلوزة صوف مجدولة بسحّاب عند الرقبة.', en: 'Cable-knit sweater with a zip at the neck.' },
      price: 16.5,
      sizes: ['M', 'L', 'XL', 'XXL'],
      hero: { clips: ['navy', 'brown', 'grey', 'beige', 'cream'] },
      specs: [
        { ar: 'صوف مجدول', en: 'Cable knit' },
        { ar: 'سحّاب عند الرقبة', en: 'Zip at the neck' },
        { ar: 'رقبة عالية', en: 'High neck' },
        { ar: 'كم طويل', en: 'Long sleeves' }
      ],
      colours: [
        { id: 'navy',  ar: 'كحلي',       en: 'Navy',       hex: '#22305A', img: 'assets/img/style-navy-640.webp',  imgLarge: 'assets/img/style-navy-1080.webp',  alt: 'assets/img/style-navy-alt-640.webp',  video: 'assets/video/style-navy.mp4',  poster: 'assets/img/poster-style-navy.webp' },
        { id: 'black', ar: 'أسود',       en: 'Black',      hex: '#1B1B1D', img: 'assets/img/style-black-640.webp', imgLarge: 'assets/img/style-black-1080.webp', alt: 'assets/img/style-black-alt-640.webp' },
        { id: 'cream', ar: 'سكري',       en: 'Off-white',      hex: '#EDE6CF', img: 'assets/img/style-cream-640.webp', imgLarge: 'assets/img/style-cream-1080.webp', alt: 'assets/img/style-cream-alt-640.webp', video: 'assets/video/style-cream.mp4', poster: 'assets/img/poster-style-cream.webp' },
        { id: 'brown', ar: 'بني',        en: 'Brown',      hex: '#4A2F28', img: 'assets/img/style-brown-640.webp', imgLarge: 'assets/img/style-brown-1080.webp', alt: 'assets/img/style-brown-alt-640.webp', video: 'assets/video/style-brown.mp4', poster: 'assets/img/poster-style-brown.webp' },
        { id: 'grey',  ar: 'رمادي فاتح', en: 'Light Grey', hex: '#B8BBBE', img: 'assets/img/style-grey-640.webp',  imgLarge: 'assets/img/style-grey-1080.webp',  alt: 'assets/img/style-grey-alt-640.webp',  video: 'assets/video/style-grey.mp4',  poster: 'assets/img/poster-style-grey.webp' },
        { id: 'beige', ar: 'بيج',        en: 'Beige',      hex: '#C2A882', img: 'assets/img/style-beige-640.webp', imgLarge: 'assets/img/style-beige-1080.webp', alt: 'assets/img/style-beige-alt-640.webp', video: 'assets/video/style-beige.mp4', poster: 'assets/img/poster-style-beige.webp' }
      ],
      films: [
        { video: 'assets/video/style-navy.mp4',  poster: 'assets/img/poster-style-navy.webp',  colour: 'navy' },
        { video: 'assets/video/style-brown.mp4', poster: 'assets/img/poster-style-brown.webp', colour: 'brown' },
        { video: 'assets/video/style-grey.mp4',  poster: 'assets/img/poster-style-grey.webp',  colour: 'grey' },
        { video: 'assets/video/style-cream.mp4', poster: 'assets/img/poster-style-cream.webp', colour: 'cream' }
      ]
    }
  ]
};
