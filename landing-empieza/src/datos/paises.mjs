// Países con página propia. prefijo: código telefónico para el WhatsApp del
// formulario. monedas: las que se ofrecen en la pregunta de monedas.

export const paises = [
  { slug: 'cuba', nombre: 'Cuba', en: 'en Cuba', prefijo: '53', monedas: ['CUP', 'USD', 'EUR'], gentilicio: 'cubanos', nota: 'Pensado para mipymes y trabajadores por cuenta propia que cobran en pesos, dólares y euros a la vez.' },
  { slug: 'uruguay', nombre: 'Uruguay', en: 'en Uruguay', prefijo: '598', monedas: ['UYU', 'USD'], gentilicio: 'uruguayos', nota: 'Para comercios que venden en pesos uruguayos y manejan precios o compras en dólares.' },
  { slug: 'mexico', nombre: 'México', en: 'en México', prefijo: '52', monedas: ['MXN', 'USD'], gentilicio: 'mexicanos', nota: 'Para tienditas, abarrotes, ferreterías y pymes que necesitan ordenar ventas, inventario y fiados.' },
  { slug: 'panama', nombre: 'Panamá', en: 'en Panamá', prefijo: '507', monedas: ['USD', 'PAB'], gentilicio: 'panameños', nota: 'Para comercios que venden en dólares y quieren controlar caja, inventario y sucursales.' },
  { slug: 'estados-unidos', nombre: 'Estados Unidos', en: 'en Estados Unidos', prefijo: '1', monedas: ['USD'], gentilicio: 'latinos en Estados Unidos', nota: 'Para negocios latinos en Estados Unidos que prefieren un sistema y una atención en español.' },
  { slug: 'venezuela', nombre: 'Venezuela', en: 'en Venezuela', prefijo: '58', monedas: ['VES', 'USD'], gentilicio: 'venezolanos', nota: 'Para comercios que cobran en bolívares y dólares, con precios que cambian con la tasa.' },
  { slug: 'colombia', nombre: 'Colombia', en: 'en Colombia', prefijo: '57', monedas: ['COP', 'USD'], gentilicio: 'colombianos', nota: 'Para tiendas, misceláneas y negocios de barrio que quieren dejar el cuaderno.' },
  { slug: 'republica-dominicana', nombre: 'República Dominicana', en: 'en República Dominicana', prefijo: '1', monedas: ['DOP', 'USD'], gentilicio: 'dominicanos', nota: 'Para colmados y comercios que venden en pesos dominicanos y dólares.' },
  { slug: 'argentina', nombre: 'Argentina', en: 'en Argentina', prefijo: '54', monedas: ['ARS', 'USD'], gentilicio: 'argentinos', nota: 'Para comercios que necesitan actualizar costos y precios rápido cuando cambia todo.' },
  { slug: 'peru', nombre: 'Perú', en: 'en Perú', prefijo: '51', monedas: ['PEN', 'USD'], gentilicio: 'peruanos', nota: 'Para bodegas y negocios que venden en soles y manejan compras en dólares.' },
  { slug: 'chile', nombre: 'Chile', en: 'en Chile', prefijo: '56', monedas: ['CLP', 'USD'], gentilicio: 'chilenos', nota: 'Para almacenes y pymes que quieren controlar stock, caja y fiados desde el celular.' },
];

export const paisPorSlug = Object.fromEntries(paises.map(p => [p.slug, p]));
