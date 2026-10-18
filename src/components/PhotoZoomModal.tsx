import React from 'react';
import { X, Plus, ShoppingBag } from 'lucide-react';
import type { Product } from '../types.ts';
import { formatPrice } from '../utils/formatters.ts';
import { getProductImageUrl } from '../utils/imageUrl.ts';

interface PhotoZoomModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (product: Product) => void;
}

export const PhotoZoomModal: React.FC<PhotoZoomModalProps> = ({
  product,
  onClose,
  onAdd,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-zoom-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-800 overflow-hidden text-stone-800 flex flex-col max-h-[92vh]">
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 bg-stone-950/60 hover:bg-stone-950/80 text-white p-2 rounded-full backdrop-blur-xs transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big 4:3 Image */}
        <div className="w-full aspect-4/3 bg-stone-100 overflow-hidden relative">
          <img
            key={product.photoUrl ? `${product.photoUrl}_${product.updatedAt || ''}` : product.id}
            src={getProductImageUrl(product.photoUrl, product.updatedAt, 'full')}
            alt={product.name}
            width="800"
            height="600"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details & Action */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 block">
                Foto do Produto
              </span>
              <h2 id="photo-zoom-title" className="text-2xl sm:text-3xl font-black text-stone-900">
                {product.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-stone-500 block">Preço</span>
              <span className="text-2xl sm:text-3xl font-black text-purple-950">
                {formatPrice(product.price)}
              </span>
            </div>
          </div>

          {product.description && (
            <p className="text-base text-stone-700 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 transition cursor-pointer text-sm"
            >
              Voltar
            </button>
            <button
              disabled={!product.available}
              onClick={() => {
                onClose();
                onAdd(product);
              }}
              className="flex-1 min-h-[48px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-base sm:text-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>{product.available ? 'Personalizar e Adicionar' : 'Produto Esgotado'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
