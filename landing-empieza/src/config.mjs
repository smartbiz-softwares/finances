// Configuración de la landing empieza.smartbiz.com.uy.
// Todo lo que el negocio puede cambiar sin tocar el diseño vive aquí.

export const config = {
  marca: 'SmartBusiness',
  asistente: 'Hera',
  dominio: 'https://empieza.smartbiz.com.uy',
  sitioPrincipal: 'https://smartbiz.com.uy',
  instagram: 'https://www.instagram.com/smartbusiness_cu/',

  // WhatsApp de contacto directo (formato internacional, solo dígitos).
  whatsapp: '5359079144',
  whatsappVisible: '+53 5907 9144',

  // A dónde envía el formulario las solicitudes. El servidor de la landing
  // (servidor.mjs) las reenvía por correo. Vacío = solo WhatsApp.
  endpointSolicitudes: '/api/solicitud',

  // Agenda de sesiones para "armar el negocio".
  agenda: {
    zonaHoraria: 'America/Havana',
    etiquetaHora: 'hora de Cuba',
    // 0 = domingo … 6 = sábado
    dias: [1, 2, 3, 4, 5, 6],
    desde: 9,
    hasta: 18,
    duracionMin: 60,
    diasAdelante: 14,
    // Mínimo de horas entre ahora y la primera sesión que se puede reservar.
    margenHoras: 3,
    // Fechas sin agenda, formato AAAA-MM-DD.
    bloqueadas: [],
  },

  // Video de demostración. Mientras no haya uno real, la página muestra una
  // demo animada hecha en HTML con la historia del episodio piloto de Hera.
  video: {
    youtubeId: '',
    titulo: 'SmartBusiness en 90 segundos: cómo Hera encuentra las fugas de tu negocio',
    descripcion: 'Demostración de SmartBusiness: fiados sin cobrar, inventario y caja controlados desde el celular.',
    duracionISO: 'PT1M30S',
    publicado: '2026-11-01',
  },

  // Casos de éxito reales. Mientras haya menos de 3, la página completa los
  // huecos con un esqueleto del diseño. Para publicar uno, añade un objeto así
  // (con permiso del cliente) y vuelve a compilar:
  //   {
  //     negocio: 'Minimarket La Esquina',
  //     persona: 'María Pérez, dueña',
  //     ciudad: 'Montevideo',
  //     sector: 'tienda-almacen-minimarket',   // slug de src/datos/sectores.mjs
  //     cita: 'No era que me robaran. Era que no me acordaba de quién me debía.',
  //     cifra: '80%',
  //     cifraTexto: 'de los fiados cobrados en tres semanas',
  //     despues: 'Cada fiado tiene nombre, monto y fecha, y cobra con recordatorios.',
  //   },
  casos: [],
};

export const whatsappUrl = (texto = '') =>
  `https://wa.me/${config.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
