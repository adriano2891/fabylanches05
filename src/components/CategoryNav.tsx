import React, { useMemo } from 'react';
import {
  Utensils,
  Flame,
  Soup,
  GlassWater,
  Sparkles,
  Cake,
  Coffee,
  Pizza,
  Apple,
} from 'lucide-react';
import type { CustomCategory } from '../types.ts';
import { normalizeCategoryKey, parseCustomCategories, formatCategoryLabel } from '../utils/formatters.ts';

export type CategoryKey = string;

export interface CategoryItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CategoryNavProps {
  selectedCategory: CategoryKey;
  onSelectCategory: (category: CategoryKey) => void;
  productCounts: Record<string, number>;
  customCategories?: (CustomCategory | CategoryItem | string)[];
}

export function getCategoryIcon(key: string): React.ComponentType<{ className?: string }> {
  const clean = key.toLowerCase().trim();
  switch (clean) {
    case 'todos':
      return Utensils;
    case 'lanches':
    case 'lanche':
    case 'hamburgueres':
    case 'burgers':
      return Flame;
    case 'cuscuz':
    case 'cuscuzes':
      return Utensils;
    case 'sopas':
    case 'sopa':
    case 'canjas':
    case 'caldos':
      return Soup;
    case 'bebidas':
    case 'bebida':
    case 'sucos':
    case 'vitaminas':
      return GlassWater;
    case 'sobremesas':
    case 'sobremesa':
    case 'doces':
      return Cake;
    case 'cafes':
    case 'cafe':
      return Coffee;
    case 'pizzas':
    case 'pizza':
      return Pizza;
    case 'acai':
    case 'frutas':
      return Apple;
    default:
      return Sparkles;
  }
}

export { formatCategoryLabel } from '../utils/formatters.ts';

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  productCounts,
  customCategories,
}) => {
  const itemRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  // Lista completa de todas as categorias cadastradas lado a lado
  const categoriesList = useMemo<CategoryItem[]>(() => {
    // Categorias padrão cadastradas no cardápio
    const baseKeys = ['todos', 'lanches', 'cuscuz', 'sopas', 'bebidas'];

    // 1. Categorias configuradas no cadastro da loja (customCategories)
    const parsedCustom = parseCustomCategories(customCategories as any);

    // 2. Categorias presentes nos produtos/contagens
    const productKeys = Object.keys(productCounts).filter(
      (k) => !baseKeys.includes(k) && k !== 'todos'
    );

    const dynamicMap = new Map<string, string>();
    parsedCustom.forEach((c) => dynamicMap.set(c.id, c.name));
    productKeys.forEach((k) => {
      if (!dynamicMap.has(k)) {
        dynamicMap.set(k, formatCategoryLabel(k));
      }
    });

    const dynamicKeys = Array.from(dynamicMap.keys());
    const allKeys = [...baseKeys, ...dynamicKeys];

    return allKeys.map((key) => {
      const customItem = (customCategories as any[])?.find(
        (c) => c && (c.key === key || c.id === key)
      );
      return {
        key,
        label: customItem?.label || customItem?.name || dynamicMap.get(key) || formatCategoryLabel(key),
        icon: customItem?.icon || getCategoryIcon(key),
      };
    });
  }, [productCounts, customCategories]);

  // Rola suavemente a categoria ativa para o centro no mobile quando selecionada
  React.useEffect(() => {
    const activeEl = itemRefs.current[selectedCategory];
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedCategory]);

  return (
    <nav aria-label="Categorias do cardápio" className="max-w-6xl mx-auto px-2 sm:px-4 py-1.5 sm:py-3 w-full">
      {/* No mobile: categorias estritamente na mesma linha com scroll horizontal suave e sem quebra */}
      {/* No desktop/tablet (sm:): agrupamento centralizado com flex-wrap se necessário */}
      <div className="flex flex-nowrap overflow-x-auto no-scrollbar items-center gap-2 sm:gap-2.5 py-1 px-1 sm:px-0 sm:flex-wrap sm:justify-center w-full scroll-smooth [-webkit-overflow-scrolling:touch]">
        {categoriesList.map((cat) => {
          const isSelected = normalizeCategoryKey(selectedCategory) === normalizeCategoryKey(cat.key);
          const Icon = cat.icon;
          const count = productCounts[cat.key] ?? productCounts[normalizeCategoryKey(cat.key)] ?? 0;

          return (
            <button
              key={cat.key}
              ref={(el) => {
                itemRefs.current[cat.key] = el;
              }}
              id={`cat-btn-${cat.key}`}
              type="button"
              onClick={() => onSelectCategory(cat.key)}
              aria-pressed={isSelected}
              className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-150 select-none cursor-pointer active:scale-95 shadow-2xs ${
                isSelected
                  ? 'bg-purple-900 text-amber-300 ring-2 ring-purple-600 shadow-md scale-[1.02]'
                  : 'bg-white text-stone-700 hover:text-purple-900 hover:bg-purple-50/90 border border-stone-200/90 hover:border-purple-300'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0 ${
                  isSelected ? 'text-amber-300' : 'text-purple-700'
                }`}
              />
              <span className="tracking-tight font-extrabold whitespace-nowrap">
                {cat.label}
              </span>
              <span
                className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black ${
                  isSelected
                    ? 'bg-purple-800 text-amber-200'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
