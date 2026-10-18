import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, AlertCircle, ShoppingBag, Info } from 'lucide-react';
import type { Product, Additional, CartItem, SelectedAdditional } from '../types.ts';
import { formatPrice } from '../utils/formatters.ts';
import { getProductImageUrl } from '../utils/imageUrl.ts';

interface ProductModalProps {
  product: Product;
  additionals: Additional[];
  existingItem?: CartItem | null;
  onClose: () => void;
  onSaveToCart: (item: CartItem) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  additionals,
  existingItem,
  onClose,
  onSaveToCart,
}) => {
  // Quantity
  const [quantity, setQuantity] = useState<number>(existingItem?.quantity || 1);

  // Removed ingredients (only from product.removableIngredients)
  const [removedIngredients, setRemovedIngredients] = useState<string[]>(
    existingItem?.removedIngredients || []
  );

  // Drink size selection (if product has sizes)
  const hasDrinkSizes = product.isDrink && product.drinkDetails?.sizes && product.drinkDetails.sizes.length > 0;
  const [selectedSizeId, setSelectedSizeId] = useState<string>(
    existingItem?.drinkOption?.sizeId || (hasDrinkSizes ? product.drinkDetails!.sizes![0]?.id : '')
  );

  // Additionals selection (id -> quantity)
  const [selectedAddsMap, setSelectedAddsMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    if (existingItem?.additionals) {
      existingItem.additionals.forEach((a) => {
        map[a.id] = a.quantity;
      });
    }
    return map;
  });

  // Observations
  const [notes, setNotes] = useState<string>(existingItem?.notes || '');

  // Calculate base price
  const basePrice = useMemo(() => {
    if (hasDrinkSizes) {
      const sizeObj = product.drinkDetails!.sizes!.find((s) => s.id === selectedSizeId);
      return sizeObj ? sizeObj.price : product.price;
    }
    return product.price;
  }, [hasDrinkSizes, product, selectedSizeId]);

  // Filter applicable additionals
  // Active additionals that are either globally allowed or linked to this product
  const applicableAdditionals = useMemo(() => {
    return additionals.filter((add) => {
      if (!add.active) return false;
      if (product.allowedAdditionalIds && product.allowedAdditionalIds.length > 0) {
        return product.allowedAdditionalIds.includes(add.id);
      }
      return true;
    });
  }, [additionals, product]);

  // Additionals total
  const additionalsTotalPerUnit = useMemo(() => {
    let sum = 0;
    applicableAdditionals.forEach((add) => {
      const qty = selectedAddsMap[add.id] || 0;
      sum += add.price * qty;
    });
    return sum;
  }, [applicableAdditionals, selectedAddsMap]);

  // Unit Price with additionals
  const unitPrice = basePrice + additionalsTotalPerUnit;
  // Total Price
  const totalPrice = unitPrice * quantity;

  // Toggle ingredient removal
  const toggleIngredient = (ing: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  // Change additional quantity
  const setAddQuantity = (add: Additional, qty: number) => {
    const bounded = Math.max(0, Math.min(add.maxQuantity || 5, qty));
    setSelectedAddsMap((prev) => ({
      ...prev,
      [add.id]: bounded,
    }));
  };

  const handleConfirm = () => {
    // Format selected additionals
    const formattedAdditionals: SelectedAdditional[] = [];
    applicableAdditionals.forEach((add) => {
      const q = selectedAddsMap[add.id] || 0;
      if (q > 0) {
        formattedAdditionals.push({
          id: add.id,
          name: add.name,
          price: add.price,
          quantity: q,
        });
      }
    });

    let drinkOption;
    if (hasDrinkSizes) {
      const sizeObj = product.drinkDetails!.sizes!.find((s) => s.id === selectedSizeId);
      drinkOption = {
        sizeId: selectedSizeId,
        sizeName: sizeObj?.name,
        flavor: product.drinkDetails?.flavor,
      };
    }

    const item: CartItem = {
      id: existingItem?.id || `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId: product.id,
      productName: product.name,
      basePrice,
      quantity,
      removedIngredients,
      additionals: formattedAdditionals,
      notes: notes.trim(),
      drinkOption,
      unitPriceWithAdditionals: unitPrice,
      totalPrice,
    };

    onSaveToCart(item);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-hidden sm:overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4"
    >
      <div className="relative bg-white w-full h-full sm:h-auto sm:max-w-lg rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border sm:border-stone-200 overflow-hidden flex flex-col max-h-none sm:max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/90 shrink-0 sticky top-0 z-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 block">
              Personalizar Pedido
            </span>
            <h2 id="modal-title" className="text-xl sm:text-2xl font-black text-stone-900">
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-stone-800">
          {/* Product Photo Banner if available */}
          {product.photoUrl && (
            <div className="w-full h-36 sm:h-44 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs relative shrink-0">
              <img
                key={product.photoUrl ? `${product.photoUrl}_${product.updatedAt || ''}` : product.id}
                src={getProductImageUrl(product.photoUrl, product.updatedAt)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description reminder */}
          {product.description && (
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
              {product.description}
            </p>
          )}

          {/* Drink Size Selector if applicable */}
          {hasDrinkSizes && (
            <div>
              <label className="text-sm font-bold text-stone-900 block mb-2 uppercase tracking-wide">
                Selecione o Tamanho:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.drinkDetails!.sizes!.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setSelectedSizeId(s.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      selectedSizeId === s.id
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-400'
                        : 'border-stone-200 hover:border-purple-300 bg-white'
                    } ${!s.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="font-bold text-stone-900">{s.name}</span>
                    <span className="text-sm font-extrabold text-purple-900">
                      {formatPrice(s.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Retirar Ingredientes */}
          {product.removableIngredients && product.removableIngredients.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                  Deseja retirar algum ingrediente?
                </span>
              </div>
              <p className="text-xs text-stone-600 flex items-center gap-1 mb-2.5">
                <Info className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                A retirada de ingredientes não altera o valor do produto.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.removableIngredients.map((ing) => {
                  const isRemoved = removedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => toggleIngredient(ing)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition cursor-pointer select-none ${
                        isRemoved
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-white border-stone-200 hover:border-stone-300 text-stone-800'
                      }`}
                    >
                      <span className={isRemoved ? 'line-through text-rose-700' : ''}>
                        Sem {ing}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isRemoved
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isRemoved && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adicionais (configurados pelo admin) */}
          {applicableAdditionals.length > 0 && (
            <div>
              <span className="text-sm font-bold text-stone-900 block mb-1 uppercase tracking-wide">
                Adicionais Especiais
              </span>
              <p className="text-xs text-stone-600 mb-2.5">
                Turbine seu pedido com ingredientes extras fresquinhos
              </p>

              <div className="space-y-2">
                {applicableAdditionals.map((add) => {
                  const currentQty = selectedAddsMap[add.id] || 0;
                  return (
                    <div
                      key={add.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white hover:border-purple-200 transition"
                    >
                      <div>
                        <span className="font-semibold text-stone-900 block text-sm sm:text-base">
                          {add.name}
                        </span>
                        <span className="text-xs font-bold text-purple-900">
                          +{formatPrice(add.price)} cada
                        </span>
                      </div>

                      {/* Quantity control */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={currentQty === 0}
                          onClick={() => setAddQuantity(add, currentQty - 1)}
                          className="w-8 h-8 rounded-lg border border-stone-300 flex items-center justify-center disabled:opacity-30 hover:bg-stone-100 transition cursor-pointer"
                        >
                          <Minus className="w-4 h-4 text-stone-700" />
                        </button>
                        <span className="w-6 text-center font-bold text-sm sm:text-base text-stone-900">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          disabled={currentQty >= (add.maxQuantity || 5)}
                          onClick={() => setAddQuantity(add, currentQty + 1)}
                          className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 hover:bg-purple-200 flex items-center justify-center disabled:opacity-30 transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label
              htmlFor="item-notes"
              className="text-sm font-bold text-stone-900 block mb-1 uppercase tracking-wide"
            >
              Alguma observação? (Opcional)
            </label>
            <textarea
              id="item-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pão bem quentinho, caprichar no molho..."
              className="w-full p-3 rounded-xl border border-stone-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 text-sm outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer: Dynamic Calculations & Confirm Button */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 shrink-0 sticky bottom-0 z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:shadow-none">
          <div className="flex items-center justify-between mb-3 text-xs sm:text-sm text-stone-600">
            <span>
              Preço un.: <strong>{formatPrice(basePrice)}</strong>
              {additionalsTotalPerUnit > 0 && (
                <> + Adicionais: <strong>{formatPrice(additionalsTotalPerUnit)}</strong></>
              )}
              {' '}= <strong>{formatPrice(unitPrice)}</strong>
            </span>
            <span className="font-medium text-stone-700">
              {quantity}x = <strong className="text-stone-900">{formatPrice(totalPrice)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center border border-stone-300 rounded-xl bg-white shadow-2xs">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
                className="w-11 h-12 flex items-center justify-center hover:bg-stone-100 disabled:opacity-30 rounded-l-xl transition cursor-pointer"
              >
                <Minus className="w-5 h-5 text-stone-700" />
              </button>
              <span className="w-10 text-center font-black text-lg text-stone-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar quantidade"
                className="w-11 h-12 flex items-center justify-center hover:bg-stone-100 rounded-r-xl transition cursor-pointer"
              >
                <Plus className="w-5 h-5 text-stone-700" />
              </button>
            </div>

            {/* Add / Save Button */}
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 min-h-[48px] h-12 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-base sm:text-lg rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{existingItem ? 'Atualizar Item' : 'Adicionar'} • {formatPrice(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
