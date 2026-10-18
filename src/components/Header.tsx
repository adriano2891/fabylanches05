import React from 'react';
import { FabyLogo } from './FabyLogo.tsx';
import { ShoppingBag } from 'lucide-react';
import { formatPrice } from '../utils/formatters.ts';

interface HeaderProps {
  customLogoUrl?: string;
  totalCartCount: number;
  subtotalCents: number;
  onOpenCart: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  customLogoUrl,
  totalCartCount,
  subtotalCents,
  onOpenCart,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white shadow-md border-b border-purple-800/40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3 min-h-[72px] sm:min-h-0">
        {/* Left & Center: Brand Logo & Chamada Comercial Alinhada na Altura da Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 min-w-0 flex-1">
          {/* Logo Oficial - aumentado com fundo 100% transparente sem alterar a altura da barra */}
          <div className="cursor-pointer shrink-0 flex items-center transition-transform hover:scale-[1.03] active:scale-[0.98] relative z-10">
            <FabyLogo customUrl={customLogoUrl} size="lg" />
          </div>

          {/* Chamada Comercial Centralizada em 3 Linhas (Cima, Meio e Baixo) - Fundo Transparente Sem Borda */}
          <div className="flex items-center justify-center min-w-0 flex-1 px-0.5">
            <div className="relative flex flex-col items-center justify-center text-center px-0.5 xs:px-2 sm:px-3 py-0.5 bg-transparent border-0 shadow-none min-w-0 max-w-fit gap-0.5 sm:gap-0">
              {/* Linha de cima: Bateu a fome? */}
              <span className="text-[10.5px] xs:text-[12px] sm:text-xs md:text-sm font-extrabold uppercase tracking-wide text-amber-300 leading-tight select-none drop-shadow-xs">
                Bateu a fome?
              </span>
              {/* Linha do meio: Vem de Faby Lanches! */}
              <span className="text-[12.5px] xs:text-[14.5px] sm:text-sm md:text-base font-black uppercase tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-xs leading-tight select-none whitespace-nowrap">
                Vem de Faby Lanches!
              </span>
              {/* Linha de baixo: Sabor que conquista */}
              <span className="text-[9.5px] xs:text-[11px] sm:text-[11px] md:text-xs font-bold text-amber-100/95 tracking-wide leading-tight select-none whitespace-nowrap drop-shadow-xs">
                Sabor que conquista
              </span>
            </div>
          </div>
        </div>

        {/* Right: Header Cart Button */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">

          {/* Desktop/Tablet/Mobile Quick Cart trigger */}
          <button
            onClick={onOpenCart}
            aria-label={`Carrinho com ${totalCartCount} itens`}
            className="relative flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-md transition active:scale-95 shrink-0"
          >
            <div className="relative flex items-center">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-stone-900 shrink-0" />
              {totalCartCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-fuchsia-600 text-white text-[10px] sm:text-[11px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {totalCartCount > 99 ? '99+' : totalCartCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-[10px] uppercase font-bold text-stone-800 tracking-wider">
                Meu Pedido
              </span>
              <span className="text-sm font-extrabold text-stone-950">
                {formatPrice(subtotalCents)}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
