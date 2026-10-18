import React from 'react';
import { X, MessageCircle, GlassWater } from 'lucide-react';
import type { Product } from '../types.ts';

interface DrinkInquiryModalProps {
  product: Product;
  whatsappNumber: string;
  onClose: () => void;
}

export const DrinkInquiryModal: React.FC<DrinkInquiryModalProps> = ({
  product,
  whatsappNumber,
  onClose,
}) => {
  const flavor = product.drinkDetails?.flavor || product.name;

  const handleOpenWhatsApp = () => {
    const text = `Olá, Faby Lanches! Gostaria de consultar as opções de tamanho, valores e disponibilidade para ${product.name} (Sabor: ${flavor}).`;
    const cleanNum = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drink-inquiry-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden text-stone-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-purple-50">
          <div className="flex items-center gap-2 text-purple-900">
            <GlassWater className="w-5 h-5 text-purple-700" />
            <span className="font-bold text-sm">Opções e Valores de Bebidas</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-stone-600 hover:text-stone-900 rounded-full hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center text-purple-800">
            <GlassWater className="w-8 h-8" />
          </div>

          <div>
            <h3 id="drink-inquiry-title" className="text-xl font-black text-stone-900">
              {product.name}
            </h3>
            <p className="text-sm text-stone-600 mt-1">
              Sabor selecionado: <strong className="text-purple-900">{flavor}</strong>
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs sm:text-sm text-amber-900 text-left">
            <p className="font-semibold mb-1">Consulte opções e valores com nossa equipe:</p>
            <p className="text-amber-800 leading-relaxed">
              Temos opções preparadas na hora com água ou leite, copos de diferentes tamanhos e combinações. Toque abaixo para conversar no WhatsApp!
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Consultar no WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm text-stone-600 hover:text-stone-800 font-medium"
            >
              Voltar ao cardápio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
