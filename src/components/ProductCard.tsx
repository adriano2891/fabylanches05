import React from 'react';
import { Plus, Eye, MessageCircle, Sparkles, Utensils, GlassWater, Flame, Soup } from 'lucide-react';
import type { Product } from '../types.ts';
import { formatPrice } from '../utils/formatters.ts';
import { getProductImageUrl, getProductImageSrcSet } from '../utils/imageUrl.ts';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onZoomPhoto?: (product: Product) => void;
  onInquireDrink?: (product: Product) => void;
  isFeatured?: boolean;
  isPriority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onZoomPhoto,
  onInquireDrink,
  isFeatured = false,
  isPriority = false,
}) => {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [product.photoUrl, product.updatedAt]);

  const hasPhoto = Boolean(product.photoUrl && product.photoUrl.trim() !== '' && !imgError);

  // Check if drink has no prices registered
  const isDrinkWithoutPrices =
    product.isDrink &&
    (product.price === 0 || !product.price) &&
    (!product.drinkDetails?.sizes || product.drinkDetails.sizes.length === 0);

  // Category Icon for photo fallback
  const getCategoryIcon = () => {
    switch (product.categoryId) {
      case 'lanches':
        return <Flame className="w-8 h-8 text-purple-400" />;
      case 'cuscuz':
        return <Utensils className="w-8 h-8 text-amber-500" />;
      case 'sopas':
        return <Soup className="w-8 h-8 text-purple-400" />;
      case 'bebidas':
        return <GlassWater className="w-8 h-8 text-fuchsia-400" />;
      default:
        return <Utensils className="w-8 h-8 text-purple-400" />;
    }
  };

  return (
    <article
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between p-3.5 sm:p-4 shadow-2xs hover:shadow-md ${
        isFeatured
          ? 'border-purple-300 ring-1 ring-purple-200/80 bg-gradient-to-br from-white to-purple-50/20'
          : 'border-stone-200 hover:border-purple-300'
      } ${!product.available ? 'opacity-70 bg-stone-50/80' : ''}`}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Queridinhos +Pedidos</span>
        </div>
      )}

      {/* TOP SECTION: L-Format Layout (Text on the left, Inner Image Card on the right) */}
      <div className={`flex items-start justify-between gap-2.5 sm:gap-4 ${isFeatured ? 'pt-5' : ''}`}>
        {/* Left Side: Product Name and Full Description (sem título de ingrediente) */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-stone-900 tracking-tight leading-snug break-words">
              {product.name}
            </h3>
            {!product.available && (
              <span className="shrink-0 bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-rose-200">
                Esgotado
              </span>
            )}
          </div>

          {/* Description only - Sem título nem repetição de texto de ingredientes, exibição completa sem cortes */}
          {product.description && (
            <p className="text-xs sm:text-sm md:text-base text-stone-600 leading-relaxed font-normal mt-1 break-words">
              {product.description}
            </p>
          )}
        </div>

        {/* Right Side: Inner Image Card (Card retangular dentro, bem legível e ajustado) */}
        <div className="shrink-0">
          <div
            onClick={() => hasPhoto && onZoomPhoto && onZoomPhoto(product)}
            className={`w-24 h-20 xs:w-28 xs:h-24 sm:w-36 sm:h-28 md:w-40 md:h-32 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 relative shadow-2xs transition-transform duration-200 ${
              hasPhoto ? 'cursor-pointer hover:scale-[1.03] active:scale-95 hover:border-purple-300 hover:shadow-xs' : ''
            }`}
            title={hasPhoto ? 'Toque para ampliar a foto do produto' : product.name}
          >
            {hasPhoto ? (
              <>
                <img
                  key={product.photoUrl ? `${product.photoUrl}_${product.updatedAt || ''}` : product.id}
                  src={getProductImageUrl(product.photoUrl, product.updatedAt, 'thumbnail')}
                  srcSet={getProductImageSrcSet(product.photoUrl, product.updatedAt)}
                  sizes="(max-width: 640px) 112px, 160px"
                  alt={product.name}
                  width="160"
                  height="128"
                  className="w-full h-full object-cover"
                  loading={isFeatured || isPriority ? 'eager' : 'lazy'}
                  fetchPriority={isFeatured || isPriority ? 'high' : 'low'}
                  decoding="async"
                  onError={() => setImgError(true)}
                />
                <div className="absolute bottom-1.5 right-1.5 bg-stone-950/70 backdrop-blur-xs text-white p-1 sm:p-1.5 rounded-md opacity-90 hover:opacity-100 transition shadow-xs">
                  <Eye className="w-3.5 h-3.5 text-amber-300" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-gradient-to-br from-stone-50 to-purple-50 text-center">
                {getCategoryIcon()}
                <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-wider">
                  Faby Lanches
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Preço & Botão de Ação (Base do L, espaçamento confortável) */}
      <div className="pt-3 mt-3 border-t border-stone-100 flex flex-wrap xs:flex-nowrap items-center justify-between gap-2.5 sm:gap-3">
        {/* Preço em destaque */}
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 block uppercase tracking-wider truncate">
            {isDrinkWithoutPrices ? 'Opções e Valores' : 'Preço por unidade'}
          </span>
          {isDrinkWithoutPrices ? (
            <span className="text-xs sm:text-sm md:text-base font-bold text-purple-900 block leading-tight">
              Consulte opções e valores
            </span>
          ) : (
            <span className="text-xl sm:text-2xl md:text-[26px] font-black text-purple-950 tracking-tight whitespace-nowrap">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Botão de ação (Altura confortável e texto adaptável sem cortes) */}
        <div className="shrink-0">
          {isDrinkWithoutPrices ? (
            <button
              type="button"
              onClick={() => onInquireDrink && onInquireDrink(product)}
              className="min-h-[44px] sm:min-h-[48px] px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs sm:text-base transition flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Consultar</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!product.available}
              onClick={() => onSelect(product)}
              aria-label={`Adicionar ${product.name} ao pedido`}
              className={`min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-sm sm:text-base md:text-lg transition flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm select-none whitespace-nowrap ${
                product.available
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-stone-950 cursor-pointer'
                  : 'bg-stone-200 text-stone-600 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>{product.available ? 'Adicionar' : 'Indisponível'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
