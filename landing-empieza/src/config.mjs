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

  // Casos de éxito. Mientras real sea false se muestran con la etiqueta
  // "Ejemplo ilustrativo" y no se publican como reseñas en los datos
  // estructurados. Sustituir por clientes reales (con su permiso) y poner
  // real: true.
  casos: [
    {
      real: false,
      negocio: 'Ferretería de barrio',
      persona: 'Dueño',
      ciudad: 'La Habana',
      sector: 'ferreteria',
      antes: 'Contaba el almacén a ojo y compraba tornillos que ya tenía.',
      despues: 'Ve el stock de cada producto desde el celular y compra solo lo que falta.',
      cifra: '−30%',
      cifraTexto: 'de compras repetidas en el primer mes',
      cita: 'Antes compraba por miedo a quedarme sin nada. Ahora compro mirando el teléfono.',
    },
    {
      real: false,
      negocio: 'Minimarket familiar',
      persona: 'Dueña',
      ciudad: 'Montevideo',
      sector: 'tienda-almacen-minimarket',
      antes: 'Tenía un cuaderno con 40 clientes que le debían y no sabía cuánto sumaban.',
      despues: 'Cada fiado tiene nombre, monto y fecha, y cobra con recordatorios.',
      cifra: '80%',
      cifraTexto: 'de los fiados cobrados en tres semanas',
      cita: 'No era que me robaran. Era que no me acordaba de quién me debía.',
    },
    {
      real: false,
      negocio: 'Cafetería con dos locales',
      persona: 'Socio',
      ciudad: 'Ciudad de Panamá',
      sector: 'restaurante-cafeteria',
      antes: 'Cerrar la caja de los dos locales le llevaba casi tres horas cada noche.',
      despues: 'Cierra las dos cajas en 20 minutos y ve cuánto ganó cada local.',
      cifra: '20 min',
      cifraTexto: 'para cerrar caja, antes casi 3 horas',
      cita: 'Por fin sé cuál de los dos locales me da de comer.',
    },
  ],
};

export const whatsappUrl = (texto = '') =>
  `https://wa.me/${config.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
