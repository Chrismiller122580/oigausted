'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { isMobileBrowser } from '@/lib/pwa-install';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  X, ArrowLeft, ArrowRight, Check,
  Hand, Search, CreditCard, Star, PartyPopper, Wrench, Package, Link2, Coins,
  type LucideIcon,
} from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  tips: string[];
  icon?: LucideIcon;
  target?: string;      // CSS selector for element to highlight (e.g. '#tutorial-create-gig')
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTutorialProps {
  mode: 'buyer' | 'seller';
  onComplete: () => void;
  onClose: () => void;
}

const buyerSteps: TutorialStep[] = [
  {
    title: "Bienvenido a OigaGIG",
    description: "OigaGIG conecta compradores con profesionales locales en Colombia. Chat seguro en la app, pagos con Wompi y reseñas reales.",
    tips: [
      "Explora gigs por categoría o cerca de ti",
      "Usa la ubicación para ver servicios locales",
      "Lee reseñas y calificaciones antes de contratar"
    ],
    icon: Hand
  },
  {
    title: "Busca y Contacta",
    description: "Encuentra el servicio que necesitas. Mira el botón resaltado abajo y haz clic en 'Explorar Gigs' para ver opciones cerca de ti.",
    tips: [
      "Usa filtros de categoría, precio y distancia",
      "El botón 'Chatear en OigaGIG' abre mensajes en la app",
      "Pregunta detalles antes de pagar"
    ],
    icon: Search,
    target: "#tutorial-explore-gigs",
    placement: "bottom"
  },
  {
    title: "Paga de Forma Segura",
    description: "Usa Nequi, PSE o PayU para pagar. El dinero se libera cuando el servicio está completado.",
    tips: [
      "Elige Nequi para pagos instantáneos (recomendado)",
      "Recibes confirmación inmediata",
      "El vendedor recibe el pago después de completar"
    ],
    icon: CreditCard
  },
  {
    title: "Sigue tu Pedido y Califica",
    description: "Sigue el progreso del pedido en tiempo real. Una vez completado, deja una reseña honesta.",
    tips: [
      "Recibe notificaciones de cambios de estado",
      "Chatea con el vendedor en la página del pedido",
      "Deja reseña para ayudar a otros compradores"
    ],
    icon: Star,
    target: "#tutorial-recent-orders",
    placement: "top"
  }
];

const sellerSteps: TutorialStep[] = [
  {
    title: "¡Felicidades! Ahora eres Vendedor",
    description: "Has desbloqueado nuevas herramientas. Crea gigs, recibe pedidos, cobra con Nequi y comparte tu perfil público. Mira la tarjeta resaltada.",
    tips: [
      "Tu perfil público está en oigagig.com/sellers/tu-slug",
      "Comparte el enlace para atraer clientes directos",
      "Los compradores pagan con Nequi/PayU"
    ],
    icon: PartyPopper,
    target: "#tutorial-public-profile",
    placement: "bottom"
  },
  {
    title: "Crea tu Primer Gig",
    description: "Publica tus servicios con precios claros y campos dinámicos (ej: número de habitaciones para limpieza). Mira el botón resaltado y haz clic para empezar.",
    tips: [
      "Usa fotos atractivas de tu trabajo",
      "Define campos extras para aumentar ingresos",
      "Activa 'isRemote' si ofreces servicios online"
    ],
    icon: Wrench,
    target: "#tutorial-create-gig",
    placement: "bottom"
  },
  {
    title: "Gestiona Pedidos y Pagos",
    description: "Recibe notificaciones cuando alguien compra. Actualiza el estado del pedido y cobra cuando termines.",
    tips: [
      "Acepta el pedido y pasa a 'En Progreso'",
      "Chatea con el cliente en la página del pedido",
      "Marca como 'Completado' para liberar el pago"
    ],
    icon: Package
  },
  {
    title: "Tu Perfil Público y Reputación",
    description: "Actualiza tu información de negocio, radio de servicio y foto de portada. Las reseñas construyen confianza.",
    tips: [
      "Responde mensajes en /messages y completa tu ubicación",
      "Comparte tu enlace en redes y tarjetas",
      "Responde rápido para mejorar tu calificación"
    ],
    icon: Link2
  },
  {
    title: "Gana más con Referidos",
    description: "Invita a otros vendedores. Ganas comisión cuando ellos completen pedidos.",
    tips: [
      "Tu código de referido está en el dashboard",
      "Comisión por defecto 5% (puede variar)",
      "Revisa tus ganancias en la sección de referidos"
    ],
    icon: Coins,
    target: "#tutorial-referrals-nav",
    placement: "bottom"
  }
];

/** Prefer a visible match when several nodes share the same tutorial id (desktop + mobile nav). */
function findVisibleTarget(selector: string): HTMLElement | null {
  const nodes = document.querySelectorAll(selector);
  let fallback: HTMLElement | null = null;

  for (const node of nodes) {
    const el = node as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
      continue;
    }

    // Prefer elements actually painted on-screen (not display:none parents)
    if (el.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) === false) {
      continue;
    }

    if (!fallback) fallback = el;

    // Prefer fully (or mostly) in viewport
    const inView =
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0;
    if (inView) return el;
  }

  return fallback;
}

export default function OnboardingTutorial({ mode, onComplete, onClose }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [useCompactLayout, setUseCompactLayout] = useState(false);
  const steps = mode === 'buyer' ? buyerSteps : sellerSteps;
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    const syncLayout = () => setUseCompactLayout(isMobileBrowser());
    syncLayout();
    window.addEventListener('resize', syncLayout);
    return () => window.removeEventListener('resize', syncLayout);
  }, []);

  const clearSpotlightStyles = () => {
    document.querySelectorAll<HTMLElement>('[data-tutorial-spotlight="1"]').forEach((el) => {
      el.removeAttribute('data-tutorial-spotlight');
      el.style.boxShadow = '';
      el.style.backgroundColor = '';
      el.style.color = '';
      el.style.borderRadius = '';
      el.style.padding = '';
      el.style.outline = '';
    });
  };

  /**
   * Style the real control for contrast. We do NOT raise z-index here —
   * sticky navs create stacking contexts that stay under the tutorial overlay.
   * Visibility comes from a true cutout mask (four panels), not elevation.
   */
  const styleTarget = (el: HTMLElement) => {
    clearSpotlightStyles();
    el.style.borderRadius = '12px';
    el.style.backgroundColor = 'rgb(255, 255, 255)';
    el.style.color = 'rgb(24, 24, 27)';
    el.style.boxShadow = '0 0 0 3px rgb(249, 115, 22)';
    el.setAttribute('data-tutorial-spotlight', '1');
  };

  // Compute highlight target rect (viewport-relative) when step changes
  const updateTargetRect = (opts?: { scroll?: boolean }) => {
    if (!step.target) {
      clearSpotlightStyles();
      setTargetRect(null);
      return;
    }
    const el = findVisibleTarget(step.target);
    if (el) {
      if (opts?.scroll) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
      styleTarget(el);
      const rect = el.getBoundingClientRect();
      // Extra pad so the cutout fully clears the control + ring
      const pad = 8;
      setTargetRect(
        new DOMRect(
          Math.max(0, rect.left - pad),
          Math.max(0, rect.top - pad),
          rect.width + pad * 2,
          rect.height + pad * 2,
        ),
      );
    } else {
      clearSpotlightStyles();
      setTargetRect(null);
    }
  };

  useEffect(() => {
    updateTargetRect({ scroll: true });

    const handleUpdate = () => updateTargetRect();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    // Re-measure after layout / sticky nav settles
    const t1 = setTimeout(() => updateTargetRect(), 150);
    const t2 = setTimeout(() => updateTargetRect(), 400);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      clearTimeout(t1);
      clearTimeout(t2);
      clearSpotlightStyles();
    };
  }, [currentStep, step.target]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const isHighlighting = !!targetRect && !!step.target && !useCompactLayout;
  const showSpotlight = !!targetRect && !!step.target;
  const StepIcon = step.icon;

  // Explicit solid light/dark colors — never rely on translucent theme tokens for body copy.
  const stepCardBody = (
    <>
      <div className={`border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between ${useCompactLayout ? 'p-4' : 'p-5'}`}>
        <div className="flex items-center gap-3 min-w-0">
          {StepIcon && (
            <div className={`rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 flex items-center justify-center flex-shrink-0 ${useCompactLayout ? 'w-9 h-9' : 'w-10 h-10'}`}>
              <StepIcon size={useCompactLayout ? 18 : 20} />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {mode === 'buyer' ? 'Capacitación para Compradores' : 'Capacitación para Vendedores'} • Paso {currentStep + 1} de {steps.length}
            </div>
            <h2 className={`font-bold text-zinc-950 dark:text-white truncate ${useCompactLayout ? 'text-lg' : 'text-xl'}`}>{step.title}</h2>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Cerrar tutorial"
          className="text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X size={18} />
        </Button>
      </div>

      <CardContent className={`space-y-4 text-sm ${useCompactLayout ? 'p-4' : 'p-5'}`}>
        <p className="text-zinc-800 dark:text-zinc-100 leading-relaxed text-[15px]">{step.description}</p>

        <div className="bg-orange-50 dark:bg-zinc-800 rounded-xl p-4 border border-orange-200/80 dark:border-zinc-600">
          <p className="font-semibold text-xs mb-2 text-orange-800 dark:text-orange-300">Consejos clave:</p>
          <ul className="space-y-1.5 text-xs text-zinc-900 dark:text-zinc-100">
            {step.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 mt-0.5 shrink-0 font-bold">•</span>
                <span className="text-zinc-900 dark:text-zinc-100 leading-snug">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {showSpotlight ? (
          <p className="text-[11px] font-medium text-orange-800 dark:text-orange-300 text-center">
            Mira el control resaltado en naranja en la pantalla.
          </p>
        ) : null}

        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
          <div
            className="bg-orange-600 dark:bg-orange-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardContent>

      <div className={`border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2 ${useCompactLayout ? 'p-3' : 'p-4'}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="gap-1 text-xs border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} /> Anterior
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Saltar
          </Button>
          <Button
            size="sm"
            onClick={handleNext}
            className="gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs"
          >
            {currentStep === steps.length - 1 ? (
              <>Finalizar <Check size={14} /></>
            ) : (
              <>Siguiente <ArrowRight size={14} /></>
            )}
          </Button>
        </div>
      </div>
    </>
  );

  /**
   * True cutout: four dim panels around the target (not a full overlay).
   * The hole stays undimmed so nav/button text remains fully readable.
   */
  const renderSpotlight = () => {
    if (!targetRect) {
      return (
        <div className="fixed inset-0 z-[260] bg-black/70" onClick={onClose} aria-hidden />
      );
    }

    const t = targetRect.top;
    const l = targetRect.left;
    const w = targetRect.width;
    const h = targetRect.height;
    const dim = 'fixed z-[260] bg-black/70';

    const panels: CSSProperties[] = [
      { top: 0, left: 0, width: '100%', height: Math.max(0, t) },
      { top: t + h, left: 0, width: '100%', height: Math.max(0, window.innerHeight - (t + h)) },
      { top: t, left: 0, width: Math.max(0, l), height: h },
      { top: t, left: l + w, width: Math.max(0, window.innerWidth - (l + w)), height: h },
    ];

    return (
      <>
        {panels.map((style, i) => (
          <div
            key={i}
            className={dim}
            style={style}
            onClick={onClose}
            aria-hidden
          />
        ))}
        {/* Orange frame around the hole (pointer-events none so the real control stays clickable) */}
        <div
          className="fixed z-[261] rounded-2xl border-[3px] border-orange-500 shadow-[0_0_0_3px_rgba(255,255,255,0.9)] pointer-events-none"
          style={{ top: t, left: l, width: w, height: h }}
          aria-hidden
        />
      </>
    );
  };

  // Position the callout card relative to the highlight (default bottom)
  const getCardStyle = () => {
    if (!targetRect) return {};
    const padding = 12;
    let top = targetRect.bottom + padding;
    let left = targetRect.left;

    // Prefer below, flip above if not enough space
    const cardHeight = 340; // approx
    if (top + cardHeight > window.innerHeight - 20) {
      top = targetRect.top - cardHeight - padding;
    }

    // Clamp horizontally
    const cardWidth = 420;
    if (left + cardWidth > window.innerWidth - 20) {
      left = window.innerWidth - cardWidth - 20;
    }
    if (left < 20) left = 20;

    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 263,
      maxWidth: `${Math.min(cardWidth, window.innerWidth - 40)}px`,
    };
  };

  // Small arrow pointing to the highlighted element
  const getArrowStyle = () => {
    if (!targetRect) return {};
    const placement = step.placement || 'bottom';
    if (placement === 'bottom') {
      return {
        position: 'absolute' as const,
        top: -8,
        left: 28,
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderBottom: '8px solid #f97316', // orange-600
      };
    }
    // Add more placements if needed; default works for most
    return {};
  };

  const cardSurface =
    'bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-600 text-zinc-950 dark:text-white shadow-2xl';

  return (
    <div className="fixed inset-0 z-[260]">
      {isHighlighting ? (
        <>
          {renderSpotlight()}

          <Card
            className={`${cardSurface} w-full z-[263]`}
            style={getCardStyle()}
          >
            <div style={getArrowStyle()} />
            {stepCardBody}
          </Card>
        </>
      ) : showSpotlight && useCompactLayout ? (
        <>
          {renderSpotlight()}

          <Card className={`fixed inset-x-0 bottom-0 z-[263] rounded-t-2xl rounded-b-none max-h-[78vh] overflow-y-auto safe-area-inset-bottom ${cardSurface}`}>
            {stepCardBody}
          </Card>
        </>
      ) : (
        <div className={`fixed inset-0 flex bg-black/70 ${useCompactLayout ? 'items-end p-0' : 'items-center p-4'}`}>
          <Card className={`w-full z-[263] ${cardSurface} ${useCompactLayout ? 'rounded-t-2xl rounded-b-none max-h-[85vh] overflow-y-auto safe-area-inset-bottom' : 'max-w-2xl'}`}>
            {stepCardBody}
          </Card>
        </div>
      )}
    </div>
  );
}
