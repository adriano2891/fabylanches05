import React from 'react';
import {
  Clock,
  MapPin,
  Phone,
  CreditCard,
  Truck,
  MessageCircle,
} from 'lucide-react';
import type { StoreConfig, StoreStatus } from '../types.ts';
import { formatPhoneDisplay } from '../utils/formatters.ts';
import { FabyLogo } from './FabyLogo.tsx';
import { PaymentIcon } from './PaymentIcon.tsx';

interface StoreInfoFooterProps {
  config: StoreConfig;
  status: StoreStatus;
  onOpenAdmin?: () => void;
  hasCartItems?: boolean;
}

export const StoreInfoFooter: React.FC<StoreInfoFooterProps> = ({
  config,
  status,
  onOpenAdmin,
  hasCartItems = false,
}) => {
  const cleanPhone = (config.whatsappNumber || '5584991537520').replace(/\D/g, '');
  const enabledPayments = config.paymentMethods?.filter((p) => p.enabled) || [];

  return (
    <footer className={`mt-auto bg-stone-900 text-stone-200 border-t border-stone-800 ${hasCartItems ? 'pb-20 sm:pb-5' : 'pb-3 sm:pb-4'}`}>
      {/* Top Banner Accent */}
      <div className="h-1.5 bg-gradient-to-r from-purple-700 via-fuchsia-600 to-amber-400" />

      <div className="max-w-6xl mx-auto px-4 pt-4 sm:pt-5 pb-1 space-y-3.5 sm:space-y-4">
        {/* Brand & Slogan */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 sm:gap-6 pb-4 sm:pb-5 border-b border-stone-800 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start space-y-1">
            <FabyLogo customUrl={config.logoUrl} size="sm" />
            <p className="text-amber-400 font-bold text-xs sm:text-sm tracking-wide leading-tight">
              {config.tagline || 'Bateu a fome? Vem de Faby Lanches!'}
            </p>
            <p className="text-stone-400 text-[11px] sm:text-xs leading-tight">
              {config.slogan || 'Sabor que conquista!'}
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1">
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>WhatsApp: {formatPhoneDisplay(config.whatsappNumber)}</span>
            </a>
            <span className="text-[10px] sm:text-[11px] text-stone-400">
              Atendimento e pedidos pelo WhatsApp
            </span>
          </div>
        </div>

        {/* 3 Information Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-sm">
          {/* Horários */}
          <div className="space-y-2 bg-stone-800/40 p-3 sm:p-3.5 rounded-xl border border-stone-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs sm:text-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>Horários de Atendimento</span>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-1 gap-x-3 gap-y-0.5 text-[11px] text-stone-300">
              {config.businessHours?.map((h) => (
                <div key={h.dayOfWeek} className="flex justify-between items-center py-0.5">
                  <span className="text-stone-400">{h.dayName}:</span>
                  <span className="font-semibold text-right">
                    {h.enabled && h.periods && h.periods.length > 0
                      ? h.periods.map((p) => `${p.open} às ${p.close}`).join(' / ')
                      : 'Fechado'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-stone-500 pt-1 border-t border-stone-800/80">
              * Fuso horário de atendimento: América/Mossoró.
            </p>
          </div>

          {/* Entrega, Frete & Retirada */}
          <div className="space-y-2 bg-stone-800/40 p-3 sm:p-3.5 rounded-xl border border-stone-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs sm:text-sm">
              <Truck className="w-3.5 h-3.5" />
              <span>Entrega & Frete</span>
            </div>
            <div className="space-y-1.5 text-[11px] sm:text-xs text-stone-300">
              <p className="leading-snug">
                <strong className="text-stone-100">Frete:</strong> Informado via WhatsApp após consulta do endereço.
              </p>
              {config.pickupAddress && config.pickupAddress.trim() && (
                <p className="leading-snug flex items-start gap-1 text-stone-300">
                  <MapPin className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-100">Retirada:</strong> {config.pickupAddress}
                  </span>
                </p>
              )}
              {config.deliveryTimeEstimate && (
                <p className="text-stone-400 leading-snug">
                  Estimativa de entrega: {config.deliveryTimeEstimate}
                </p>
              )}
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="space-y-2 bg-stone-800/40 p-3 sm:p-3.5 rounded-xl border border-stone-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs sm:text-sm">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pagamentos Aceitos</span>
            </div>
            {/* Todos os ícones de pagamento na mesma linha */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
              {enabledPayments.length > 0 ? (
                enabledPayments.map((p) => {
                  const cleanName = p.name.toLowerCase();
                  const displayName = cleanName.includes('crédito')
                    ? 'Crédito'
                    : cleanName.includes('débito')
                    ? 'Débito'
                    : cleanName.includes('dinheiro')
                    ? 'Dinheiro'
                    : p.name;

                  return (
                    <div
                      key={p.id}
                      title={p.name}
                      className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-700/80 shadow-2xs hover:border-amber-400/40 transition"
                    >
                      <PaymentIcon type={p.type || p.id} size="sm" className="shrink-0" />
                      <span className="text-[10px] sm:text-xs text-stone-100 font-bold whitespace-nowrap truncate">
                        {displayName}
                      </span>
                    </div>
                  );
                })
              ) : (
                <span className="text-xs text-stone-400">
                  Pagamento a combinar pelo WhatsApp
                </span>
              )}
            </div>
            <p className="text-[10px] text-stone-400 leading-tight">
              Aceitamos pagamentos no ato da entrega ou retirada, conforme a forma escolhida.
            </p>
          </div>
        </div>

        {/* Bottom Sub-strip */}
        <div className="pt-2 pb-1 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-[10.5px] sm:text-[11px] text-stone-500">
          <p>© {new Date().getFullYear()} Faby Lanches. Todos os direitos reservados.</p>
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-stone-500 hover:text-amber-400 transition cursor-pointer text-[10.5px] sm:text-[11px] flex items-center gap-1"
            >
              <span>Painel Admin</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
