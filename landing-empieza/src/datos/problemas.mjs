// Las 7 fugas de un negocio, las mismas de la Temporada 1 de "Hera al rescate".
// Las funciones reciben un sector para escribir la escena con su vocabulario.
//
// Las cifras de las escenas son ejemplos narrativos y se presentan como tales.

export const problemas = [
  {
    slug: 'fiados-sin-cobrar',
    clave: 'fiado',
    nombre: 'Fiados sin cobrar',
    villano: 'El fiado fantasma',
    titulo: 'Control de fiados y cuentas por cobrar',
    tituloPara: s => `Control de fiados y cuentas por cobrar para ${s.plural}`,
    opcion: 'Clientes que me deben (fiados)',
    hook: 'Vendiste todo el mes… y no tienes el dinero.',
    resumen:
      'Ventas que quedaron "para después" en un cuaderno, sin fecha ni total. No es robo: nadie sabe quién debe, cuánto ni desde cuándo.',
    funcion: 'Cuentas por cobrar con nombre, monto y fecha de cada deuda',
    terminos: ['control de fiados', 'cuentas por cobrar', 'clientes que me deben', 'libreta de fiados', 'ventas a crédito', 'cobrar deudas de clientes'],
    preguntas: ['cómo controlar los fiados', 'cómo cobrar a clientes que me deben', 'cómo llevar las cuentas por cobrar', 'cómo anotar las ventas a crédito'],
    escena: s =>
      `En ${s.su}, ${s.clientes} se llevan ${s.venta} y dicen "te lo pago el viernes". Se anota en un cuaderno, a veces en un papel suelto, a veces en ningún lado. A fin de mes la caja no refleja lo que se vendió, y el dinero que falta no se perdió: está repartido en decenas de deudas pequeñas que nadie suma.`,
    sintomas: s => [
      `Tienes un cuaderno o una libreta con nombres y montos, pero no sabes el total que te deben.`,
      `Te enteras de que un cliente debía mucho cuando ya dejó de venir a ${s.su}.`,
      'Te da vergüenza cobrar porque no tienes claro desde cuándo es la deuda.',
      'Vendes bien todo el mes y aun así te falta efectivo para reponer.',
    ],
    causa: () =>
      'El fiado no es el problema: es una forma de vender que fideliza. El problema es fiar sin registro. Sin fecha, sin total por cliente y sin recordatorio, cada deuda se vuelve invisible y el dinero deja de existir para el negocio.',
    pasos: s => [
      `Registra cada venta a crédito en el momento: cliente, monto y fecha en que promete pagar.`,
      'Mira el total que te deben, cliente por cliente, en una sola pantalla.',
      'Envía un recordatorio amable cuando llega la fecha, sin discusiones.',
      `Marca los pagos parciales: ${s.clientes} pueden abonar poco a poco y el saldo se actualiza solo.`,
    ],
    faq: s => [
      {
        p: `¿Cómo controlo los fiados de ${s.su}?`,
        r: `Anotando cada venta a crédito con el nombre del cliente, el monto y la fecha de pago, y revisando el total pendiente cada semana. SmartBusiness lo hace en una pantalla de cuentas por cobrar y te avisa cuando una deuda vence.`,
      },
      {
        p: '¿Puedo registrar pagos parciales?',
        r: 'Sí. Cada abono se descuenta del saldo del cliente y queda en su historial, así nadie discute cuánto falta.',
      },
      {
        p: '¿Tengo que dejar de fiar?',
        r: 'No. Fiar bien registrado fideliza clientes. Lo que se elimina es la deuda olvidada.',
      },
    ],
  },
  {
    slug: 'inventario-descuadrado',
    clave: 'stock',
    nombre: 'Inventario que no cuadra',
    villano: 'El inventario a ojo',
    titulo: 'Control de inventario y stock',
    tituloPara: s => `Control de inventario y stock para ${s.plural}`,
    opcion: 'El inventario no me cuadra',
    hook: 'Tienes el almacén lleno y la tienda vacía.',
    resumen:
      'Compras lo que ya tienes, te quedas sin lo que más vendes y nunca sabes cuánto dinero tienes parado en mercancía.',
    funcion: 'Inventario en tiempo real con alertas de stock bajo',
    terminos: ['control de inventario', 'control de stock', 'sistema de inventario', 'programa de inventario', 'inventario en tiempo real', 'kardex'],
    preguntas: ['cómo llevar el inventario de mi negocio', 'cómo controlar el stock', 'cómo saber qué productos se venden más', 'cómo hacer un inventario fácil'],
    escena: s =>
      `En ${s.lugar} hay cajas que nadie abre desde hace meses, mientras ${s.clientes} preguntan por ${s.productos} que se acabaron ayer. Se compra "por si acaso", se repite el pedido de lo que ya había y el dinero se queda dormido en estantes.`,
    sintomas: s => [
      `Haces pedidos de memoria y a veces compras lo que ya tenías en ${s.lugar}.`,
      'Se te acaban justo los productos que más se venden.',
      'Cuando cuentas la mercancía, el número nunca coincide con lo que esperabas.',
      'No sabes cuánto dinero tienes invertido en mercancía ahora mismo.',
    ],
    causa: () =>
      'El inventario a ojo funciona mientras el negocio es pequeño. Cuando crecen los productos, los proveedores o los empleados, la memoria deja de alcanzar. Sin un registro que se descuente con cada venta, el stock real y el que crees tener se separan un poco cada día.',
    pasos: s => [
      `Carga tus ${s.unidad === 'platos' ? 'ingredientes y platos' : 'productos'} una sola vez, con su costo y su precio.`,
      'Cada venta descuenta el stock automáticamente, sin contar a mano.',
      'Recibe una alerta cuando un producto llega a su mínimo.',
      'Compra mirando lo que se vende de verdad, no lo que crees que falta.',
    ],
    faq: s => [
      {
        p: `¿Cómo llevo el inventario de ${s.su} sin perder tiempo?`,
        r: 'Registrando entradas cuando compras y dejando que cada venta descuente el stock sola. Así solo cuentas para verificar, no para adivinar.',
      },
      {
        p: '¿Necesito lector de código de barras?',
        r: 'No es obligatorio. Puedes buscar los productos por nombre. Si tus productos tienen código, el lector acelera la venta.',
      },
      {
        p: '¿Qué hago con la mercancía que no se vende?',
        r: 'Primero verla: el sistema te muestra qué productos llevan más tiempo sin moverse para que decidas ofertas o dejes de comprarlos.',
      },
    ],
  },
  {
    slug: 'caja-que-no-cuadra',
    clave: 'caja',
    nombre: 'La caja no cuadra',
    villano: 'La caja descuadrada',
    titulo: 'Control de caja y cierre diario',
    tituloPara: s => `Control de caja y cierre diario para ${s.plural}`,
    opcion: 'La caja no me cierra',
    hook: 'Te falta dinero cada noche. Y no es robo.',
    resumen:
      'Cada cierre falta (o sobra) algo. Sospechas de todos, pero casi siempre es una venta sin registrar, un vuelto mal dado o un gasto que salió de la caja sin anotarse.',
    funcion: 'Punto de venta con apertura y cierre de caja',
    terminos: ['control de caja', 'cierre de caja', 'arqueo de caja', 'punto de venta', 'sistema de caja', 'caja registradora'],
    preguntas: ['cómo hacer el cierre de caja', 'por qué no me cuadra la caja', 'cómo controlar la caja de mi negocio', 'cómo hacer un arqueo de caja'],
    escena: s =>
      `Son las diez de la noche en ${s.su}. Se cuenta el efectivo, se suma el cuaderno y faltan unos cientos. La pista falsa es pensar en un robo. Lo que pasó fue más simple: ${s.venta} que no se anotó, un pago a un proveedor que salió de la caja y un vuelto apurado.`,
    sintomas: s => [
      'El cierre de caja te lleva más de media hora y nunca da exacto.',
      'Sacas dinero de la caja para pagar cosas del negocio y no siempre lo anotas.',
      `Desconfías de tu equipo en ${s.su}, pero no tienes cómo comprobar nada.`,
      'No sabes cuánto entró en efectivo y cuánto por transferencia.',
    ],
    causa: () =>
      'Una caja descuadra cuando hay movimientos que no pasan por ningún registro: ventas cobradas sin anotar, gastos pagados en efectivo y cambios entre formas de pago. Si cada movimiento queda registrado en el momento, el cierre se vuelve una comprobación de minutos.',
    pasos: () => [
      'Abre la caja con el efectivo inicial.',
      'Registra cada venta y cada gasto en el momento, con su forma de pago.',
      'Al cerrar, cuenta el efectivo: el sistema ya sabe cuánto debería haber.',
      'Revisa la diferencia, si la hay, con el detalle de cada movimiento del día.',
    ],
    faq: s => [
      {
        p: `¿Cómo hago el cierre de caja de ${s.su}?`,
        r: 'Abres con el efectivo inicial, registras ventas y gastos durante el día y al final cuentas el dinero. La diferencia entre lo esperado y lo contado te dice si algo quedó sin registrar.',
      },
      {
        p: '¿Puedo separar efectivo y transferencias?',
        r: 'Sí. Cada cobro guarda su forma de pago, así sabes cuánto debe haber en la caja física y cuánto en la cuenta.',
      },
      {
        p: '¿Y si tengo varios cajeros?',
        r: 'Cada persona registra sus ventas con su usuario, y puedes ver el cierre de cada turno por separado.',
      },
    ],
  },
  {
    slug: 'vendo-mucho-gano-poco',
    clave: 'margen',
    nombre: 'Vendo mucho y gano poco',
    villano: 'El margen invisible',
    titulo: 'Margen y ganancia por producto',
    tituloPara: s => `Cómo saber la ganancia real de ${s.plural}`,
    opcion: 'No sé cuánto gano de verdad',
    hook: 'Vendes más que nunca y ganas menos que antes.',
    resumen:
      'Algunos productos te dejan buena ganancia y otros te hacen perder dinero, pero sin el costo real de cada uno no puedes saber cuáles son.',
    funcion: 'Ganancia por producto y por día',
    terminos: ['margen de ganancia', 'calcular ganancia', 'rentabilidad por producto', 'costo y precio de venta', 'cuánto gana mi negocio', 'utilidad del negocio'],
    preguntas: ['cómo saber cuánto gana mi negocio', 'cómo calcular el margen de ganancia', 'qué productos me dejan más ganancia', 'cómo poner precio a mis productos'],
    escena: s =>
      `${s.su[0].toUpperCase() + s.su.slice(1)} tiene clientes todo el día y la caja se mueve. Pero los proveedores subieron precios y nadie actualizó el costo. Hoy ${s.venta} se vende casi al mismo precio que cuesta reponerlo, y el negocio trabaja más para ganar menos.`,
    sintomas: s => [
      'Sabes cuánto vendes, pero no cuánto ganas.',
      'Pones precios copiando a la competencia o "a ojo".',
      `Cuando sube el costo de ${s.productos}, tardas semanas en cambiar el precio.`,
      'A fin de mes no te queda lo que esperabas, aunque vendiste bien.',
    ],
    causa: () =>
      'La ganancia se esconde entre el costo y el precio. Si el costo cambia y el precio no, o si no se cuentan los gastos del negocio, se puede vender mucho y ganar poco. Conocer el margen de cada producto es lo que permite decidir qué empujar y qué dejar de vender.',
    pasos: () => [
      'Guarda el costo de cada producto cuando compras.',
      'Mira la ganancia de cada venta, no solo el total vendido.',
      'Descubre qué productos te dejan más y cuáles te dejan poco.',
      'Ajusta precios con datos cuando cambian los costos.',
    ],
    faq: s => [
      {
        p: `¿Cómo sé cuánto gana ${s.su}?`,
        r: 'Restando a cada venta lo que te costó ese producto y, al final del mes, los gastos del negocio. SmartBusiness hace la primera parte con cada venta y te muestra la ganancia del día.',
      },
      {
        p: '¿Qué pasa si el costo cambia cada mes?',
        r: 'Actualizas el costo al registrar la compra y la ganancia se calcula con el valor nuevo desde ese momento.',
      },
      {
        p: '¿Esto reemplaza a mi contador?',
        r: 'No. Te da los números del día a día para decidir. Tu contador sigue encargándose de lo fiscal.',
      },
    ],
  },
  {
    slug: 'mercancia-vencida',
    clave: 'merma',
    nombre: 'Mercancía que se vence o se pierde',
    villano: 'La merma silenciosa',
    titulo: 'Control de mermas y vencimientos',
    tituloPara: s => `Control de mermas y vencimientos para ${s.plural}`,
    opcion: 'Se me vence o se pierde mercancía',
    hook: 'Tu dinero se está venciendo en la última repisa.',
    resumen:
      'Productos que se vencen, se rompen o se echan a perder sin que nadie lo registre. Es dinero que sale del negocio sin pasar por la caja.',
    funcion: 'Registro de mermas y productos próximos a vencer',
    terminos: ['control de mermas', 'productos vencidos', 'control de vencimientos', 'pérdidas de mercancía', 'fechas de caducidad', 'desperdicio'],
    preguntas: ['cómo reducir las mermas', 'cómo controlar productos vencidos', 'cómo evitar que se venza la mercancía', 'cómo calcular las pérdidas por merma'],
    escena: s =>
      `Al fondo de ${s.lugar} hay productos que entraron hace meses. Cuando alguien los encuentra, ya no sirven y se tiran sin anotarlo. En ${s.su} eso pasa en silencio cada semana, y como no queda registro, nadie sabe cuánto dinero se fue a la basura.`,
    sintomas: s => [
      'Tiras productos vencidos o dañados casi todas las semanas.',
      `Encuentras mercancía olvidada al fondo de ${s.lugar}.`,
      'No sabes cuánto pierdes al mes por mermas.',
      'Compras más de lo que vendes de ciertos productos.',
    ],
    causa: () =>
      'La merma es inevitable, pero sin registro se multiplica. Si no se sabe qué entra primero, qué está cerca de vencer y cuánto se tira, el negocio repite los mismos errores de compra y pierde dinero cada mes.',
    pasos: () => [
      'Registra cada producto que se vence, se rompe o se pierde.',
      'Mira cuánto dinero representa la merma de la semana.',
      'Detecta qué productos se pierden más para comprar menos de ellos.',
      'Vende primero lo que entró primero.',
    ],
    faq: s => [
      {
        p: `¿Cómo reduzco las mermas de ${s.su}?`,
        r: 'Midiendo primero: registra cada pérdida con su motivo. En pocas semanas ves qué productos se pierden más y ajustas las compras.',
      },
      {
        p: '¿La merma se descuenta del inventario?',
        r: 'Sí. Al registrarla, el stock baja y la pérdida queda separada de las ventas, así tus números son reales.',
      },
      {
        p: '¿Sirve si vendo productos frescos?',
        r: 'Sí. Es justo donde más se pierde, y registrar lo que se tira cada día cambia las compras de la semana siguiente.',
      },
    ],
  },
  {
    slug: 'varias-monedas',
    clave: 'monedas',
    nombre: 'Cobro en varias monedas',
    villano: 'El cambio confuso',
    titulo: 'Ventas y control en varias monedas',
    tituloPara: s => `Ventas en varias monedas para ${s.plural}`,
    opcion: 'Cobro en varias monedas',
    hook: 'Cobras en dólares, euros y pesos… y no sabes cuánto tienes.',
    resumen:
      'Cada cliente paga como puede: efectivo en una moneda, transferencia en otra. Al final del día nadie sabe cuánto entró de verdad.',
    funcion: 'Cobros y saldos en varias monedas',
    terminos: ['varias monedas', 'multimoneda', 'cobrar en dólares', 'tipo de cambio', 'sistema multimoneda', 'ventas en dólares y pesos'],
    preguntas: ['cómo controlar ventas en dólares y pesos', 'cómo llevar la caja en varias monedas', 'cómo manejar el tipo de cambio en mi negocio'],
    escena: s =>
      `En ${s.su} un cliente paga en efectivo en moneda nacional, otro transfiere en dólares y otro trae euros. Cada cobro se anota distinto y el tipo de cambio cambia cada semana. Al cerrar, sumar todo es imposible, y la ganancia real queda escondida entre conversiones.`,
    sintomas: () => [
      'Al final del día no sabes cuánto tienes en cada moneda.',
      'Conviertes de cabeza o con la calculadora del teléfono en cada venta.',
      'Cuando cambia la tasa, no sabes si estás ganando o perdiendo.',
      'Tus precios quedan desactualizados respecto a lo que pagas al proveedor.',
    ],
    causa: () =>
      'Cobrar en varias monedas es una realidad en muchos países de América. El problema aparece cuando todo se mezcla en una sola cuenta mental. Cada moneda necesita su propio saldo, y cada venta necesita guardar en qué moneda se cobró.',
    pasos: () => [
      'Registra cada cobro en la moneda en que lo recibiste.',
      'Mira el saldo de cada moneda por separado.',
      'Usa la tasa del día para ver el total en tu moneda de referencia.',
      'Compara ventas y costos en la misma moneda para ver la ganancia real.',
    ],
    faq: s => [
      {
        p: `¿Puedo cobrar en varias monedas en ${s.su}?`,
        r: 'Sí. Cada cobro guarda su moneda y ves el saldo de cada una por separado.',
      },
      {
        p: '¿Qué pasa cuando cambia el tipo de cambio?',
        r: 'Actualizas la tasa y los totales en tu moneda de referencia se recalculan, sin tocar lo que ya cobraste en cada moneda.',
      },
      {
        p: '¿Sirve para efectivo y transferencias?',
        r: 'Sí. Puedes combinar la moneda con la forma de pago de cada venta.',
      },
    ],
  },
  {
    slug: 'esclavo-del-cuaderno',
    clave: 'tiempo',
    nombre: 'Pierdo mucho tiempo en papeles',
    villano: 'El cuaderno eterno',
    titulo: 'Organizar el negocio y ahorrar tiempo',
    tituloPara: s => `Cómo organizar ${s.plural} y ahorrar tiempo`,
    opcion: 'Pierdo mucho tiempo en papeles',
    hook: 'La fuga más cara no está en la caja. Está en tu tiempo.',
    resumen:
      'Horas cada semana sumando cuadernos, pasando datos a Excel y respondiendo "¿cuánto vendimos?". Tiempo que no estás atendiendo ni haciendo crecer el negocio.',
    funcion: 'Reportes automáticos y Hera, el asistente con IA',
    terminos: ['organizar mi negocio', 'administrar un negocio', 'sistema de gestión', 'programa para negocio', 'dejar el cuaderno', 'pasar de excel a sistema'],
    preguntas: ['cómo organizar mi negocio', 'cómo administrar un negocio pequeño', 'cómo dejar de usar el cuaderno', 'qué sistema usar para mi negocio'],
    escena: s =>
      `Es domingo y en vez de descansar estás en ${s.su} sumando el cuaderno de la semana. Cada número se pasa a mano, se revisa dos veces y aun así queda la duda. El negocio depende de que tú estés para saber cómo va.`,
    sintomas: () => [
      'Dedicas horas cada semana a sumar, copiar y revisar números.',
      'Si no estás, nadie sabe cómo va el negocio.',
      'Tienes datos en el cuaderno, en Excel y en el WhatsApp, pero en ningún lado completos.',
      'No te tomas vacaciones porque el negocio no funciona sin ti.',
    ],
    causa: () =>
      'Cuando todo pasa por la cabeza del dueño, el negocio no puede crecer más que su tiempo. Un sistema no reemplaza tu criterio: te devuelve las horas que hoy pasas sumando para que las uses decidiendo.',
    pasos: () => [
      'Registra ventas, compras y gastos en el momento, desde el celular.',
      'Mira el resumen del día sin hacer cuentas.',
      'Pregúntale a Hera, en lenguaje normal, cómo va tu negocio.',
      'Delega en tu equipo sin perder el control.',
    ],
    faq: s => [
      {
        p: `¿Cuánto tiempo lleva pasar ${s.su} a un sistema?`,
        r: 'Depende de cuántos productos tengas. En la primera sesión empezamos juntos: cargamos lo esencial para que puedas vender con el sistema desde ese día.',
      },
      {
        p: '¿Quién es Hera?',
        r: 'Hera es la asistente con inteligencia artificial de SmartBusiness. Revisa tus números, detecta lo que no cuadra y te responde preguntas sobre tu negocio en lenguaje sencillo.',
      },
      {
        p: '¿Necesito saber de computación?',
        r: 'No. Si usas WhatsApp, puedes usar SmartBusiness. Y en la sesión te acompañamos paso a paso.',
      },
    ],
  },
];

export const problemaPorSlug = Object.fromEntries(problemas.map(p => [p.slug, p]));
export const problemaPorClave = Object.fromEntries(problemas.map(p => [p.clave, p]));
