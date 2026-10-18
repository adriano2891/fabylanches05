import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  resultCount?: number;
  totalProductsCount: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  resultCount,
  totalProductsCount,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 pb-2 w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-purple-700">
          <Search className="h-5 w-5 stroke-[2.5]" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por lanche, cuscuz ou ingrediente (ex: bacon, queijo)..."
          aria-label="Buscar produtos ou ingredientes"
          className="w-full pl-11 pr-11 py-2.5 sm:py-3 text-sm sm:text-base bg-white rounded-full border-2 border-purple-400 sm:border-purple-400 focus:border-purple-600 focus:ring-4 focus:ring-purple-200/80 outline-none transition text-stone-900 placeholder:text-stone-400 shadow-xs"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              inputRef.current?.focus();
            }}
            aria-label="Limpar busca"
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-500 hover:text-stone-800 cursor-pointer active:scale-95 transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {searchTerm.trim() !== '' && (
        <div className="mt-2 text-xs sm:text-sm text-stone-600 px-2 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150">
          <span>Mostrando resultados para</span>
          <strong className="text-purple-900 font-black uppercase">"{searchTerm}"</strong>
          <span className="font-semibold text-stone-800">
            {resultCount} {resultCount === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </span>
        </div>
      )}
    </div>
  );
};
