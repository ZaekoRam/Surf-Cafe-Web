'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';

import { maintenanceSteps } from '@/config/services';
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { cn } from '@/lib/utils';

/**
 * Posiciones de las "lucecitas" que arman la tira RGB del scroll — ver la
 * nota larga junto a `.rgb-outline-glow` en `maintenance-scroll.tsx` más
 * abajo para el porqué de este truco (drop-shadow no puede variar de
 * color según el punto del contorno, así que se simula con varias copias
 * alrededor, desfasadas en el tiempo).
 */
const RGB_GLOW_LIGHTS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return {
    dx: Math.round(Math.cos(angle) * 2.5 * 10) / 10,
    dy: Math.round(Math.sin(angle) * 2.5 * 10) / 10,
    delay: -(i / 8) * 3,
  };
});

/**
 * Scrollytelling del proceso de mantenimiento.
 *
 * Como funciona:
 *   - La seccion mide `pasos * 100vh` de alto.
 *   - El escenario interno queda pinneado mientras dura el recorrido.
 *   - El progreso (0..1) se mapea a un indice de paso; cambia la ilustracion.
 *
 * El contenido de texto SIEMPRE esta en el DOM (bueno para SEO y lectores de
 * pantalla); lo unico que cambia es la presentacion.
 */
export function MaintenanceScroll() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const total = maintenanceSteps.length;

      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom bottom',
        pin: stage.current,
        pinSpacing: false,
        scrub: true,
        onUpdate: (self) => {
          setProgress(self.progress);
          // El ultimo paso necesita su propio tramo: por eso `total` y no `total - 1`.
          setActive(Math.min(total - 1, Math.floor(self.progress * total)));
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const step = maintenanceSteps[active];

  return (
    <section
      ref={root}
      id="proceso"
      aria-label="Proceso de mantenimiento"
      style={{ height: `${maintenanceSteps.length * 100}vh` }}
      className="relative"
    >
      <div className="pin-stage sticky top-0 flex items-center overflow-hidden pt-[var(--nav-h)]" ref={stage}>
        <div className="container grid w-full items-center gap-6 md:gap-12 lg:grid-cols-[1fr_auto_1fr]">
          {/* ---------- Columna de texto ---------- */}
          {/* Los 5 pasos viven siempre en el DOM, apilados en la misma celda
              de grid: así el contenedor mide lo que mide el título más
              alto de los 5 y nunca cambia de alto entre pasos (evita que el
              panel de la imagen, centrado en la misma fila, se corra). */}
          <div className="order-2 lg:order-1">
            <p className="hud-label mb-4">Proceso Surf Cafe</p>

            <div className="grid">
              {maintenanceSteps.map((s, i) => (
                <motion.div
                  key={s.id}
                  className={cn('col-start-1 row-start-1', i !== active && 'pointer-events-none')}
                  animate={{ opacity: i === active ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  aria-hidden={i !== active}
                >
                  <span className="font-mono text-6xl font-bold text-surf-green/25">{s.index}</span>
                  <h2 className="mt-2 font-display text-4xl font-black uppercase leading-tight text-glow text-surf-green md:text-5xl">
                    {s.title}
                  </h2>
                  <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/75">
                    {s.copy}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ---------- Ilustración (centro) ---------- */}
          <div className="order-1 flex flex-col items-center gap-6 lg:order-2">
            <div className="hud-panel relative flex h-40 w-40 items-center justify-center sm:h-56 sm:w-56 md:h-72 md:w-72">
              {/* Anillo de progreso */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#2A2E35" strokeWidth="1.5" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#21E14B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
                  className="drop-shadow-neon"
                />
              </svg>

              {/* Tira RGB: con la rana (transparente) se veía detrás el
                  anillo de neón, pero las fotos nuevas traían fondo blanco
                  opaco y lo tapaban. Se les quitó el fondo (quedaron en
                  `public/proceso/`, con su respaldo pesado en
                  `proceso-originals/`) para que un drop-shadow siguiendo
                  el canal alfa le trace el contorno real al sticker —
                  combina con el resto del sitio (paso "RGB Polish",
                  tarjetas de producto, etc).

                  Ojo 1: `hue-rotate` en el `filter` de un <img> recolorea
                  TODA la imagen, no solo su drop-shadow — la rana se ponía
                  rosa. Por eso la sombra la proyecta una COPIA oculta
                  (`aria-hidden`, `.rgb-outline-glow`) exactamente debajo:
                  la imagen real de encima la tapa por completo, así que
                  esa copia nunca se ve — solo asoma su sombra, que sí
                  sobresale del borde.

                  Ojo 2: esa copia oculta y la foto visible deben cambiar
                  JUNTAS. Si la copia (sin transición) cambia de foto antes
                  de que la visible (con fundido de 0.35s) termine de
                  desvanecerse, se ve el contorno de la silueta NUEVA
                  asomando detrás de la foto VIEJA todavía a medio
                  desvanecer — se percibe como un parpadeo "vieja→nueva"
                  en cada cambio de paso. Por eso ambas viven dentro del
                  MISMO `motion.div` con la MISMA `key`: solo hay una
                  animación de entrada/salida para el par completo.

                  Ojo 3: Carlo pidió que el color "viaje" alrededor del
                  contorno, como una tira de LEDs de PC gamer de verdad —
                  no que todo el borde cambie de color a la vez (eso es lo
                  que hacía un solo `drop-shadow` con `hue-rotate`, porque
                  un `drop-shadow` es UN color parejo, no puede variar
                  según el punto del contorno). Se simula con
                  `RGB_GLOW_LIGHTS`: 8 copias ocultas repartidas en
                  círculo alrededor del sticker, cada una con su sombra
                  desplazada hacia su propio ángulo y con la MISMA
                  animación de `hue-rotate` pero con `animation-delay`
                  distinto (desfasada 1/8 de vuelta cada una) — como cada
                  una está en un punto distinto del ciclo de color en todo
                  momento, el ojo arma la ilusión de un color recorriendo
                  el contorno en vez de un parpadeo parejo. */}
              <div className="relative h-28 w-28 sm:h-40 sm:w-40 md:h-56 md:w-56">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="absolute inset-0"
                  >
                    {RGB_GLOW_LIGHTS.map((light, i) => (
                      <img
                        key={i}
                        aria-hidden
                        src={step.image}
                        alt=""
                        className="rgb-outline-glow absolute inset-0 h-full w-full object-contain"
                        style={
                          {
                            '--glow-dx': `${light.dx}px`,
                            '--glow-dy': `${light.dy}px`,
                            animationDelay: `${light.delay}s`,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                    <img
                      src={step.image}
                      alt={step.title}
                      className="relative h-full w-full object-contain"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <span className="code-chip">
              paso {step.index} / 0{maintenanceSteps.length}
            </span>
          </div>

          {/* ---------- Indice de pasos ---------- */}
          <ol className="order-3 hidden lg:block">
            {maintenanceSteps.map((s, i) => (
              <li key={s.id}>
                <div
                  className={cn(
                    'flex items-center gap-4 border-l-2 py-4 pl-5 transition-all duration-300',
                    i === active
                      ? 'border-surf-green bg-surf-green/5'
                      : 'border-surface-grey opacity-45'
                  )}
                >
                  <span className="font-mono text-xs text-surf-green">{s.index}</span>
                  <span className="font-display text-sm font-bold uppercase tracking-widest">
                    {s.title}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Barra de progreso inferior */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-surface-grey">
          <div
            className="h-full bg-gradient-to-r from-surf-green to-surf-yellow shadow-neon"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
