'use client';

import { useEffect, useState } from 'react';

/**
 * Cambia de valor cuando la pestaña vuelve a primer plano después de estar
 * escondida — al restaurarse del bfcache (navegar con "atrás"/"adelante"
 * del navegador) o al regresar de otra app en celular. En esos casos React
 * no vuelve a montar el componente ni corre sus efectos, así que un fetch
 * que solo se hizo una vez al montar se queda pegado con datos viejos aunque
 * hayan cambiado en Supabase mientras tanto (ej. el cliente edita un
 * producto en /admin, regresa a la pestaña de la tienda con el botón
 * "atrás" del celular, y ve la versión de antes de editar).
 *
 * Úsalo como dependencia extra de un `useEffect` de fetch para que se
 * repita solo cuando de verdad puede haber datos nuevos.
 */
export function useRevalidateKey() {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const bump = () => setKey((k) => k + 1);

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) bump();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') bump();
    };

    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return key;
}
