'use client';

import { useEffect, useState } from 'react';
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

export default function OnboardingTutorial({ mode, onComplete, onClose }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const steps = mode === 'buyer' ? buyerSteps : sellerSteps;
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Compute highlight target rect (viewport-relative) when step changes
  const updateTargetRect = () => {
    if (!step.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    updateTargetRect();

    const handleUpdate = () => updateTargetRect();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    // Small delay in case elements render after modal
    const t = setTimeout(updateTargetRect, 150);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      clearTimeout(t);
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

  const isHighlighting = !!targetRect && !!step.target;
  const StepIcon = step.icon;

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
      zIndex: 53,
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

  return (
    <div className="fixed inset-0 z-50">
      {isHighlighting ? (
        <>
          {/* Dark overlay (click to close) */}
          <div 
            className="fixed inset-0 bg-black/70" 
            onClick={onClose}
          />

          {/* Highlight / spotlight box with glow cutout */}
          <div
            className="fixed z-[52] border-[5px] border-orange-500 rounded-3xl pointer-events-none transition-all duration-200"
            style={{
              top: `${targetRect.top - 8}px`,
              left: `${targetRect.left - 8}px`,
              width: `${targetRect.width + 16}px`,
              height: `${targetRect.height + 16}px`,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
            }}
          />

          {/* Callout card positioned next to the highlight */}
          <Card 
            className="bg-card border-border shadow-2xl w-full"
            style={getCardStyle()}
          >
            {/* small pointing arrow */}
            <div style={getArrowStyle()} />

            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                {StepIcon && (
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center flex-shrink-0">
                    <StepIcon size={20} />
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground">
                    {mode === 'buyer' ? 'Capacitación para Compradores' : 'Capacitación para Vendedores'} • Paso {currentStep + 1} de {steps.length}
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={18} />
              </Button>
            </div>

            <CardContent className="p-5 space-y-4 text-sm">
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              <div className="bg-muted/50 rounded-xl p-4">
                <p className="font-semibold text-xs mb-2 text-orange-600">Consejos clave:</p>
                <ul className="space-y-1.5 text-xs">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-[10px] text-muted-foreground text-center">
                Mira el área resaltada en naranja. Este tutorial te ayudará a aprovechar OigaGIG al máximo.
              </div>

              {/* Progress bar small */}
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div 
                  className="bg-orange-600 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>

            <div className="p-4 border-t border-border flex items-center justify-between gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePrev} 
                disabled={currentStep === 0}
                className="gap-1 text-xs"
              >
                <ArrowLeft size={14} /> Anterior
              </Button>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                  Saltar
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleNext} 
                  className="gap-1 bg-orange-600 hover:bg-orange-700 text-xs"
                >
                  {currentStep === steps.length - 1 ? (
                    <>Finalizar <Check size={14} /></>
                  ) : (
                    <>Siguiente <ArrowRight size={14} /></>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </>
      ) : (
        /* Fallback centered modal (when no target or launched from pages without elements) */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-2xl bg-card border-border shadow-2xl">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                {StepIcon && (
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center flex-shrink-0">
                    <StepIcon size={24} />
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">
                    {mode === 'buyer' ? 'Capacitación para Compradores' : 'Capacitación para Vendedores'} • Paso {currentStep + 1} de {steps.length}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>

            <CardContent className="p-8 space-y-6">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              <div className="bg-muted/50 rounded-2xl p-6">
                <p className="font-semibold text-sm mb-3 text-orange-600">Consejos clave:</p>
                <ul className="space-y-2 text-sm">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Este tutorial te ayudará a aprovechar OigaGIG al máximo. Puedes volver a verlo desde Soporte.
              </div>
            </CardContent>

            <div className="p-6 border-t border-border flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrev} 
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft size={16} /> Anterior
              </Button>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Saltar por ahora
                </Button>
                <Button onClick={handleNext} className="gap-2 bg-orange-600 hover:bg-orange-700">
                  {currentStep === steps.length - 1 ? (
                    <>Finalizar <Check size={16} /></>
                  ) : (
                    <>Siguiente <ArrowRight size={16} /></>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
