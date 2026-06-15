'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  tips: string[];
  icon?: string;
}

interface OnboardingTutorialProps {
  mode: 'buyer' | 'seller';
  onComplete: () => void;
  onClose: () => void;
}

const buyerSteps: TutorialStep[] = [
  {
    title: "Bienvenido a Oigagig",
    description: "Oigagig conecta compradores con profesionales locales en Colombia. Todo con chat directo por WhatsApp, pagos seguros con Nequi/PayU y reseñas reales.",
    tips: [
      "Explora gigs por categoría o cerca de ti",
      "Usa la ubicación para ver servicios locales",
      "Lee reseñas y calificaciones antes de contratar"
    ],
    icon: "👋"
  },
  {
    title: "Busca y Contacta",
    description: "Encuentra el servicio que necesitas. Haz clic en 'Ver Detalles' o contacta directamente al vendedor.",
    tips: [
      "Usa filtros de categoría, precio y distancia",
      "El botón 'Contactar' abre WhatsApp o chat",
      "Pregunta detalles antes de pagar"
    ],
    icon: "🔍"
  },
  {
    title: "Paga de Forma Segura",
    description: "Usa Nequi, PSE o PayU para pagar. El dinero se libera cuando el servicio está completado.",
    tips: [
      "Elige Nequi para pagos instantáneos (recomendado)",
      "Recibes confirmación inmediata",
      "El vendedor recibe el pago después de completar"
    ],
    icon: "💳"
  },
  {
    title: "Sigue tu Pedido y Califica",
    description: "Sigue el progreso del pedido en tiempo real. Una vez completado, deja una reseña honesta.",
    tips: [
      "Recibe notificaciones de cambios de estado",
      "Chatea con el vendedor en la página del pedido",
      "Deja reseña para ayudar a otros compradores"
    ],
    icon: "⭐"
  }
];

const sellerSteps: TutorialStep[] = [
  {
    title: "¡Felicidades! Ahora eres Vendedor",
    description: "Has desbloqueado nuevas herramientas. Crea gigs, recibe pedidos, cobra con Nequi y comparte tu perfil público.",
    tips: [
      "Tu perfil público está en oigagig.com/sellers/tu-slug",
      "Comparte el enlace para atraer clientes directos",
      "Los compradores pagan con Nequi/PayU"
    ],
    icon: "🎉"
  },
  {
    title: "Crea tu Primer Gig",
    description: "Publica tus servicios con precios claros y campos dinámicos (ej: número de habitaciones para limpieza).",
    tips: [
      "Usa fotos atractivas de tu trabajo",
      "Define campos extras para aumentar ingresos",
      "Activa 'isRemote' si ofreces servicios online"
    ],
    icon: "🛠️"
  },
  {
    title: "Gestiona Pedidos y Pagos",
    description: "Recibe notificaciones cuando alguien compra. Actualiza el estado del pedido y cobra cuando termines.",
    tips: [
      "Acepta el pedido y pasa a 'En Progreso'",
      "Chatea con el cliente en la página del pedido",
      "Marca como 'Completado' para liberar el pago"
    ],
    icon: "📦"
  },
  {
    title: "Tu Perfil Público y Reputación",
    description: "Actualiza tu información de negocio, radio de servicio y foto de portada. Las reseñas construyen confianza.",
    tips: [
      "Agrega tu WhatsApp y ubicación para más contactos",
      "Comparte tu enlace en redes y tarjetas",
      "Responde rápido para mejorar tu calificación"
    ],
    icon: "🔗"
  },
  {
    title: "Gana más con Referidos",
    description: "Invita a otros vendedores. Ganas comisión cuando ellos completen pedidos.",
    tips: [
      "Tu código de referido está en el dashboard",
      "Comisión por defecto 5% (puede variar)",
      "Revisa tus ganancias en la sección de referidos"
    ],
    icon: "💰"
  }
];

export default function OnboardingTutorial({ mode, onComplete, onClose }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = mode === 'buyer' ? buyerSteps : sellerSteps;

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

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-2xl bg-card border-border shadow-2xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{step.icon}</div>
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
          {/* Progress bar */}
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
            Este tutorial te ayudará a aprovechar Oigagig al máximo. Puedes volver a verlo desde Soporte.
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
  );
}
