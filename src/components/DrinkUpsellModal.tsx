import React from 'react';
import { GlassWater, Plus, ChevronRight, X } from 'lucide-react';
import type { Product } from '../types.ts';
import { formatPrice } from '../utils/formatters.ts';

interface DrinkUpsellModalProps {
  availableDrinks: Product[];
  onSelectDrink: (drink: Product) => void;
  onContinueWithoutDrink: () => void;
}

export const DrinkUpsellModal: React.FC<DrinkUpsellModalProps> = ({
  availableDrinks,
  onSelectDrink,
  onContinueWithoutDrink,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upsell-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden text-stone-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-purple-50">
          <div className="flex items-center gap-2 text-purple-900">
            <GlassWater className="w-5 h-5 text-purple-700" />
            <h3 id="upsell-title" className="font-bold text-base">
              Que tal uma bebida para acompanhar?
            </h3>
          </div>
          <button
            onClick={onContinueWithoutDrink}
            aria-label="Dispensar sugestão"
            className="p-1.5 text-stone-600 hover:text-stone-900 rounded-full hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3 max-h-72 overflow-y-auto">
          <p className="text-xs sm:text-sm text-stone-600">
            Aproveite para adicionar uma bebida geladinha ao seu pedido:
          </p>
          <div className="space-y-2">
            {availableDrinks.slice(0, 4).map((drink) => (
              <div
                key={drink.id}
                className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-purple-300 bg-stone-50/50 hover:bg-white transition"
              >
                <div>
                  <span className="font-bold text-stone-900 block text-sm">
                    {drink.name}
                  </span>
                  <span className="text-xs font-extrabold text-purple-900">
                    {formatPrice(drink.price)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectDrink(drink)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Adicionar</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="p-4 border-t border-stone-100 bg-stone-50">
          <button
            type="button"
            onClick={onContinueWithoutDrink}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continuar sem bebida</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
