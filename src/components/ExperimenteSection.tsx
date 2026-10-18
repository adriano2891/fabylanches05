import React from 'react';
import { Sparkles } from 'lucide-react';
import type { Product } from '../types.ts';
import { ProductCard } from './ProductCard.tsx';

interface ExperimenteSectionProps {
  products: Product[];
  experimentProductIds: string[];
  onSelectProduct: (product: Product) => void;
  onZoomPhoto: (product: Product) => void;
  onInquireDrink: (product: Product) => void;
}

export const ExperimenteSection: React.FC<ExperimenteSectionProps> = ({
  products,
  experimentProductIds,
  onSelectProduct,
  onZoomPhoto,
  onInquireDrink,
}) => {
  // Filter products by IDs in exact specified order, and only show available products as required
  const featuredProducts = experimentProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p && p.available));

  if (featuredProducts.length === 0) return null;

  return (
    <section aria-labelledby="experimente-heading" className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="p-2 rounded-xl bg-fuchsia-100 text-fuchsia-700">
          <Sparkles className="w-5 h-5 text-fuchsia-600" />
        </div>
        <div>
          <h2 id="experimente-heading" className="text-xl sm:text-2xl font-black text-purple-950 tracking-tight">
            Queridinhos +Pedidos
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            🔥 Os favoritos dos nossos clientes. Experimente o seu!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3.5 sm:gap-6">
        {featuredProducts.map((prod) => (
          <ProductCard
            key={`exp-${prod.id}`}
            product={prod}
            onSelect={onSelectProduct}
            onZoomPhoto={onZoomPhoto}
            onInquireDrink={onInquireDrink}
            isFeatured={true}
          />
        ))}
      </div>
    </section>
  );
};
