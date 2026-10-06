'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Quote, Star } from 'lucide-react';
import { useState } from 'react';

import { googleRating, testimonials, testimonialsInitialCount } from '@/config/testimonials';

/**
 * Reseñas reales de Google Maps — refuerza confianza justo después del
 * catálogo, antes de que el visitante se vaya a rastrear un equipo o a
 * otra página. El sello 4.9★ enlaza a la ficha real de Google para que
 * cualquiera pueda verificar que no son inventadas.
 */
export function Testimonials() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? testimonials : testimonials.slice(0, testimonialsInitialCount);
  const hidden = testimonials.slice(testimonialsInitialCount);

  return (
    <section className="container relative py-28" aria-labelledby="reseñas">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="hud-label mb-3">Confianza</p>
          <h2 id="reseñas" className="font-display text-4xl font-black uppercase md:text-5xl">
            Lo que dicen <span className="text-glow text-surf-green">nuestros clientes</span>
          </h2>
        </div>

        <a
          href={googleRating.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-3 font-display text-sm font-bold uppercase tracking-widest text-surf-green"
        >
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-surf-yellow text-surf-yellow" />
            {googleRating.score} · {googleRating.count} reseñas en Google
          </span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: (i % testimonialsInitialCount) * 0.08, ease: 'easeOut' }}
            className="hud-panel flex flex-col gap-4 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star key={star} className="h-3.5 w-3.5 fill-surf-yellow text-surf-yellow" />
                ))}
              </div>
              <Quote className="h-5 w-5 text-surf-green/30" />
            </div>

            <blockquote className="flex-1 text-sm text-foreground/80">
              &ldquo;{t.text}&rdquo;
            </blockquote>

            <figcaption className="flex items-center justify-between border-t border-surface-grey pt-3">
              <span className="text-sm font-medium">{t.name}</span>
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                {t.when}
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      {hidden.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="glitch-btn"
            aria-expanded={expanded}
          >
            <span data-text={expanded ? 'Ver menos reseñas' : 'Ver más reseñas'}>
              {expanded ? 'Ver menos reseñas' : 'Ver más reseñas'}
            </span>
            <ChevronDown
              className={`h-4 w-4 animate-float transition-transform duration-300 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      )}
    </section>
  );
}
