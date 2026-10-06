/**
 * Reseñas reales de Google Maps (SURFCAFE Tienda de tecnología — 4.9★,
 * 64 opiniones al 14-sep-2026). Carlo las mandó por capturas de pantalla
 * de su cuenta con sesión iniciada; la vista de invitado de Maps solo
 * deja ver 3. Mismo criterio que `siteConfig`: dato real capturado a
 * mano, no un scraper — actualizar aquí si algún día se quiere refrescar
 * la selección.
 */
export const googleRating = {
  score: 4.9,
  count: 64,
  url: 'https://maps.app.goo.gl/UkUnzSDsG16V2HwJ7',
};

export interface Testimonial {
  name: string;
  text: string;
  /** "Hace 6 meses", "Hace 5 años"... tal como lo muestra Google. */
  when: string;
}

export const testimonials: Testimonial[] = [
  {
    name: 'Jose Antonio Ortega Contreras',
    text: 'Al único que le tengo confianza de dejarle mi PC.',
    when: 'Hace 5 años',
  },
  {
    name: 'Luis Alber',
    text: 'Servicio 10/10, muy buena atención. Es el lugar por excelencia al que he recurrido para armar mis equipos de cómputo y darles mantenimiento. Recomendado.',
    when: 'Hace 6 meses',
  },
  {
    name: 'Paulina Hernández',
    text: 'La mejor atención en el armado de las computadoras, siempre atentos antes, durante y después de adquirir el equipo.',
    when: 'Hace 6 meses',
  },
  {
    name: 'Aly Ramírez',
    text: 'Muy buen servicio de mantenimiento. La atención del chico fue muy buena, amable y atento, recomiendo ampliamente.',
    when: 'Hace 6 meses',
  },
  {
    name: 'David Vallecillos',
    text: 'Excelente servicio, surtido y buenos precios.',
    when: 'Hace 5 años',
  },
  {
    name: 'ImKreys',
    text: 'Me ayudaron mucho en el armado de mi primera computadora, y su trabajo de mantenimiento es muy bueno.',
    when: 'Hace 6 meses',
  },
  {
    name: 'Ana Palacios',
    text: 'Muy buena atención y servicio, lleve la computadora de colibecas de mi hijo, y ya puede hacer sus tareas sin que se esté trabando a cada rato.',
    when: 'Hace 6 meses',
  },
  {
    name: 'Jorge Gonzalez',
    text: 'Excelente lugar si quieres darle mantenimiento a tu computadora, también te da excelente atención para si quieres armar tu pc recomendado 100 %',
    when: 'Hace 6 meses',
  },
  {
    name: 'cesar castillo',
    text: 'Excelente personal y servicio, te atienden con amabilidad y explican todo lo que necesitas, el trabajo que realizan es de una persona profesional.',
    when: 'Hace 6 meses',
  },
  {
    name: 'Raúl García Vargas',
    text: 'Muy buena tienda para todo tipo de accesorios, mantenimiento y soporte además de contar con una excelente atención',
    when: 'Hace 6 meses',
  },
  {
    name: 'Karev Mora',
    text: 'Super! Siempre consigo todo para mi pc gamer 👏👏✨',
    when: 'Hace 6 meses',
  },
  {
    name: 'Brandon Lara Presiado',
    text: 'Mi xbox ya no servía pero a su excelente servicio mi xbox ya sirve muchas gracias',
    when: 'Hace 6 meses',
  },
];

/** Cuántas reseñas se ven de entrada, antes de desplegar el resto. */
export const testimonialsInitialCount = 6;
