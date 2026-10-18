import React from 'react';
import { Clock, AlertCircle, Bike, Store, Info, Sparkles } from 'lucide-react';
import type { StoreConfig, StoreStatus } from '../types.ts';

interface StoreStatusBannerProps {
  config: StoreConfig;
  status: StoreStatus;
}

export const StoreStatusBanner: React.FC<StoreStatusBannerProps> = ({ config, status }) => {
  const hasDeliveryTime = config.deliveryEnabled && config.deliveryTimeEstimate && config.deliveryTimeEstimate.trim() !== '';
  const hasPickupTime = config.pickupEnabled && config.pickupTimeEstimate && config.pickupTimeEstimate.trim() !== '';

  // Single block of content to be seamlessly looped
  const renderContentBlock = (keyPrefix: string) => (
    <div key={keyPrefix} className="inline-flex items-center gap-3 shrink-0 pr-6">
      {/* Status Pill (Aberto / Fechado) */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs tracking-tight ${
          status.isOpen
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
            : 'bg-rose-50 text-rose-800 border border-rose-300'
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              status.isOpen ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status.isOpen ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          />
        </span>
        <span>{status.statusLabel}</span>
      </div>

      {/* Detail (Horário / Próxima abertura) */}
      <div className="inline-flex items-center gap-1.5 text-stone-700 font-semibold text-xs sm:text-[13px]">
        <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
        <span>{status.statusDetail}</span>
        {!status.isOpen && config.acceptOrdersWhenClosed && (
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
            Aceitando pedidos
          </span>
        )}
      </div>

      {/* Separator */}
      <span className="text-stone-300 select-none">|</span>

      {/* Estimated Times */}
      {hasDeliveryTime && (
        <div className="inline-flex items-center gap-1 bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded-md font-medium text-xs sm:text-[13px]">
          <Bike className="w-3.5 h-3.5 text-purple-700 shrink-0" />
          <span>Entrega: {config.deliveryTimeEstimate}</span>
        </div>
      )}

      {hasPickupTime && (
        <div className="inline-flex items-center gap-1 bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded-md font-medium text-xs sm:text-[13px]">
          <Store className="w-3.5 h-3.5 text-purple-700 shrink-0" />
          <span>Retirada: {config.pickupTimeEstimate}</span>
        </div>
      )}

      {/* Separator */}
      <span className="text-stone-300 select-none">|</span>

      {/* WhatsApp Notice */}
      <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-amber-900 bg-amber-50/90 border border-amber-200/70 px-2.5 py-0.5 rounded-md font-medium">
        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Prazo estimado, sujeito à confirmação pelo WhatsApp.</span>
      </div>

      {/* Separator between iterations */}
      <span className="text-purple-300 font-bold px-2 select-none">✦</span>
    </div>
  );

  return (
    <div className="w-full bg-white/95 backdrop-blur-xs border-b border-stone-200/80 shadow-2xs select-none relative overflow-hidden z-20">
      {/* Temporary Pause Banner if active */}
      {status.isPaused && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-1 text-xs text-rose-800 flex items-center justify-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Pausa temporária:</strong> {status.pauseMessage || 'Voltamos em instantes!'}
          </span>
        </div>
      )}

      {/* Gradient subtle fade on left & right edges for aesthetic marquee */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

      {/* Animated Continuous Marquee Track - Rolling automatically to the left at slow speed */}
      <div className="pt-1.5 pb-0.5 overflow-hidden flex w-full">
        <div className="animate-marquee-slow flex items-center whitespace-nowrap">
          {/* Half 1: Exactly 50% width */}
          <div className="flex items-center shrink-0">
            {renderContentBlock('part-1a')}
            {renderContentBlock('part-1b')}
          </div>
          {/* Half 2: Duplicate for seamless continuous infinite rolling */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {renderContentBlock('part-2a')}
            {renderContentBlock('part-2b')}
          </div>
        </div>
      </div>

      {/* Barra degradê na parte de baixo (idêntica à do rodapé) */}
      <div className="h-1.5 bg-gradient-to-r from-purple-700 via-fuchsia-600 to-amber-400 w-full" />
    </div>
  );
};
