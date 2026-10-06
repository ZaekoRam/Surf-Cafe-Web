'use client';

import {
  Boxes,
  CalendarDays,
  ChevronLeft,
  ExternalLink,
  Film,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Sparkles,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { FrogMascot } from '@/components/brand/frog-mascot';
import { signOutAdmin } from '@/lib/admin-auth';
import { cn } from '@/lib/utils';

/** Debajo de este ancho la barra lateral es un cajón que se abre encima
 *  del contenido, no una columna fija — mismo punto de quiebre (1024px)
 *  que usa el 3D del hero (`useIsCompactCanvas`). */
function useIsMobileNav() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

/**
 * Shell del panel admin.
 *
 * Principio de diseño: "lazy-friendly" — todo a un clic, sin submenus,
 * sin buscar. La barra lateral colapsa a iconos para dejar aire al tablero.
 */
const items: { href: string; label: string; icon: LucideIcon; code: string }[] = [
  { href: '/admin', label: 'Panel', icon: LayoutDashboard, code: 'HUD' },
  { href: '/admin/reparaciones', label: 'Reparaciones', icon: Wrench, code: 'REP' },
  { href: '/admin/mantenimiento', label: 'Mantenimiento', icon: Sparkles, code: 'MTO' },
  { href: '/admin/productos', label: 'Productos', icon: Package, code: 'PRD' },
  { href: '/admin/inventario', label: 'Inventario', icon: Boxes, code: 'INV' },
  { href: '/admin/taller', label: 'El Taller', icon: Film, code: 'VID' },
  { href: '/admin/citas', label: 'Citas', icon: CalendarDays, code: 'CTA' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobileNav = useIsMobileNav();

  // En celular la barra es un cajón: cerrar solo al cambiar de página, no
  // al colapsar/expandir en escritorio.
  useEffect(() => setMobileOpen(false), [pathname]);

  // En el cajón de celular siempre se ven las etiquetas completas — el
  // modo "solo iconos" (`collapsed`) es un ahorro de espacio de escritorio,
  // no tiene sentido en un cajón que de por sí se abre y se cierra.
  const showLabels = isMobileNav || !collapsed;

  async function handleLogout() {
    await signOutAdmin();
    // Recarga completa (no solo push): así `AdminGate` vuelve a montar y
    // pregunta la sesión de Supabase Auth desde cero.
    window.location.assign('/admin/');
  }

  return (
    <div className="flex min-h-screen">
      {/* Botón para abrir el cajón — solo celular/tablet, flotante para no
          pelearse con el header de cada página (`AdminPage`). */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className={cn(
          'clip-hud-sm glass-strong fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center border border-surf-green/30 text-surf-green lg:hidden',
          mobileOpen && 'hidden'
        )}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Fondo oscuro detrás del cajón abierto — clic para cerrar. */}
      {mobileOpen && (
        <div
          aria-hidden
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-surface-deep/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ---------------- Barra lateral ---------------- */}
      <aside
        className={cn(
          'glass-strong fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-surf-green/20 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:sticky lg:top-0 lg:translate-x-0 lg:transition-[width]',
          collapsed ? 'lg:w-[76px]' : 'lg:w-64'
        )}
      >
        <div className="flex items-center gap-3 border-b border-surface-grey p-4">
          <FrogMascot size={36} className="shrink-0" />
          {showLabels && (
            <span className="flex flex-col leading-none">
              <span className="font-display text-sm font-black uppercase tracking-widest text-surf-yellow">
                Surf Cafe
              </span>
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-surf-green">
                admin
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            className="ml-auto p-1 text-muted-foreground hover:text-surf-green lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={showLabels ? undefined : item.label}
                className={cn(
                  'clip-hud-sm group relative flex items-center gap-3 px-3 py-3 transition-all',
                  active
                    ? 'bg-surf-green/12 text-surf-green shadow-neon-sm'
                    : 'text-foreground/60 hover:bg-surface-metal hover:text-surf-green'
                )}
              >
                {active && <span className="absolute inset-y-2 left-0 w-0.5 bg-surf-green" />}
                <item.icon className="h-5 w-5 shrink-0" />
                {showLabels && (
                  <span className="font-display text-xs font-bold uppercase tracking-widest">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-surface-grey p-3">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="hidden w-full items-center gap-3 px-3 py-2.5 text-muted-foreground transition-colors hover:text-surf-green lg:flex"
          >
            <ChevronLeft
              className={cn('h-5 w-5 shrink-0 transition-transform', collapsed && 'rotate-180')}
            />
            {showLabels && <span className="text-xs uppercase tracking-widest">Colapsar</span>}
          </button>

          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground transition-colors hover:text-surf-green"
          >
            <ExternalLink className="h-5 w-5 shrink-0" />
            {showLabels && <span className="text-xs uppercase tracking-widest">Ver sitio</span>}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title={showLabels ? undefined : 'Cerrar sesión'}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-muted-foreground transition-colors hover:text-destructive"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {showLabels && <span className="text-xs uppercase tracking-widest">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ---------------- Contenido ---------------- */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * Plantilla de pagina del admin. Toda vista nueva se escribe asi:
 *
 *   <AdminPage title="Productos" subtitle="42 activos" actions={<Boton/>}>
 *     ...contenido...
 *   </AdminPage>
 */
export function AdminPage({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="glass-strong sticky top-0 z-30 border-b border-surf-green/20">
        <div className="flex flex-wrap items-center justify-between gap-4 py-5 pl-20 pr-8 lg:pl-8">
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-wide">{title}</h1>
            {subtitle && (
              <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </header>

      <div className="p-8">{children}</div>
    </>
  );
}
