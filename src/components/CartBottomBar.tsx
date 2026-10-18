import React from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { formatPrice } from '../utils/formatters.ts';

interface CartBottomBarProps {
  totalCount: number;
  subtotalCents: number;
  onOpenCart: () => void;
}

export const CartBottomBar: React.FC<CartBottomBarProps> = ({
  totalCount,
  subtotalCents,
  onOpenCart,
}) => {
  if (totalCount === 0) return null;

  return (
    <aside
      aria-label="Barra do carrinho de compras"
      className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-stone-900/95 backdrop-blur-md border-t border-purple-800/50 shadow-2xl transition-transform"
    >
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        {/* Summary Details */}
        <div className="flex items-center gap-3">
          <div className="relative bg-purple-950 text-amber-300 p-2.5 rounded-xl shadow-xs border border-purple-800/60">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-fuchsia-600 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-stone-900 shadow-xs">
              {totalCount}
            </span>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block">
              Subtotal dos produtos
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">
              {formatPrice(subtotalCents)}
            </span>
          </div>
        </div>

        {/* Action Button: min height 48px */}
        <button
          onClick={onOpenCart}
          className="min-h-[48px] px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-base sm:text-lg shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>Ver pedido</span>
          <ChevronRight className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    </aside>
  );
};
