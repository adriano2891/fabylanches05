import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Bike,
  Store,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import type { CartItem, StoreConfig, StoreStatus, Product, Additional } from '../types.ts';
import { formatPrice } from '../utils/formatters.ts';
import { DrinkUpsellModal } from './DrinkUpsellModal.tsx';
import { WhatsAppConfirmModal } from './WhatsAppConfirmModal.tsx';
import { PaymentIcon } from './PaymentIcon.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  config: StoreConfig;
  status: StoreStatus;
  allProducts: Product[];
  additionals: Additional[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onEditItem: (item: CartItem) => void;
  onAddDrinkDirect: (product: Product) => void;
  onClearCart: () => void;
  onApplyServerValidation: (updatedItems: CartItem[]) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  config,
  status,
  allProducts,
  additionals,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  onAddDrinkDirect,
  onClearCart,
  onApplyServerValidation,
}) => {
  // Step in Drawer: 'cart' or 'checkout'
  const [currentStep, setCurrentStep] = useState<'cart' | 'checkout'>('cart');

  // Customer checkout fields
  const [customerName, setCustomerName] = useState<string>('');
  const [fulfillmentType, setFulfillmentType] = useState<'entrega' | 'retirada'>(
    config.deliveryEnabled ? 'entrega' : 'retirada'
  );

  // Address fields
  const [city, setCity] = useState<string>('Morroró');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [noNumber, setNoNumber] = useState<boolean>(false);
  const [complement, setComplement] = useState<string>('');
  const [reference, setReference] = useState<string>('');

  // Payment fields
  const enabledPaymentMethods = config.paymentMethods?.filter((m) => m.enabled) || [];
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
    enabledPaymentMethods[0]?.id || ''
  );
  const [cashChange, setCashChange] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');

  // Form errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Validation warning from server
  const [validationChanges, setValidationChanges] = useState<string[] | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState<boolean>(false);

  // Upsell drink state (only shown once during checkout)
  const [showUpsell, setShowUpsell] = useState<boolean>(false);
  const [hasPromptedUpsell, setHasPromptedUpsell] = useState<boolean>(false);

  // Final confirmation modal state
  const [confirmModalData, setConfirmModalData] = useState<{
    whatsappUrl: string;
    orderText: string;
    isDelivery: boolean;
  } | null>(null);

  // Calculate subtotal in cents
  const subtotalCents = useMemo(() => {
    return items.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [items]);

  // Check if cart already has drinks
  const cartHasDrink = useMemo(() => {
    return items.some((item) => {
      const prod = allProducts.find((p) => p.id === item.productId);
      return prod?.isDrink || prod?.categoryId === 'bebidas';
    });
  }, [items, allProducts]);

  // Available drinks with registered prices (> 0)
  const availablePricedDrinks = useMemo(() => {
    return allProducts.filter((p) => {
      if (!p.available) return false;
      if (!p.isDrink && p.categoryId !== 'bebidas') return false;
      if (p.price > 0) return true;
      if (p.drinkDetails?.sizes && p.drinkDetails.sizes.some((s) => s.available && s.price > 0)) {
        return true;
      }
      return false;
    });
  }, [allProducts]);

  // Neighborhood coverage check
  const neighborhoodCoverage = useMemo(() => {
    if (!neighborhood.trim()) return null;
    const clean = neighborhood.trim().toLowerCase();
    const match = config.coverageAreas?.find(
      (a) => a.name.trim().toLowerCase() === clean
    );
    if (!match) {
      return {
        status: 'unknown',
        message: 'A disponibilidade de entrega para este bairro será confirmada pelo WhatsApp.',
      };
    }
    if (match.isDelivered) {
      return {
        status: 'delivered',
        message: 'Bairro atendido! O valor do frete será calculado após confirmação do endereço.',
      };
    }
    return {
      status: 'not_delivered',
      message: 'Este bairro não é atendido para entrega no momento. Você pode optar por Retirada na loja!',
    };
  }, [neighborhood, config.coverageAreas]);

  if (!isOpen) return null;

  // Proceed to checkout: check drink upsell first
  const handleProceedToCheckout = () => {
    if (items.length === 0) return;

    if (!hasPromptedUpsell && !cartHasDrink && availablePricedDrinks.length > 0) {
      setShowUpsell(true);
      setHasPromptedUpsell(true);
      return;
    }

    setCurrentStep('checkout');
  };

  const handleSelectUpsellDrink = (drink: Product) => {
    setShowUpsell(false);
    onAddDrinkDirect(drink);
    setCurrentStep('checkout');
  };

  const handleContinueWithoutDrink = () => {
    setShowUpsell(false);
    setCurrentStep('checkout');
  };

  // Build formatted WhatsApp message
  const generateWhatsAppMessage = () => {
    const isDelivery = fulfillmentType === 'entrega';
    const lines: string[] = [];

    lines.push('Olá, Faby Lanches! Gostaria de fazer este pedido:');
    lines.push('');
    lines.push('CLIENTE');
    lines.push(`Nome: ${customerName.trim()}`);
    lines.push(`Atendimento: ${fulfillmentType}`);
    lines.push('');
    lines.push('ITENS');

    items.forEach((item) => {
      lines.push(`${item.quantity}x ${item.productName}${item.drinkOption?.sizeName ? ` (${item.drinkOption.sizeName})` : ''}`);
      if (item.removedIngredients && item.removedIngredients.length > 0) {
        lines.push(`Retirar: ${item.removedIngredients.join(', ')}`);
      }
      if (item.additionals && item.additionals.length > 0) {
        const addsDesc = item.additionals
          .map((a) => `${a.quantity}x ${a.name} (${formatPrice(a.price * a.quantity)})`)
          .join(', ');
        lines.push(`Adicionais: ${addsDesc}`);
      }
      if (item.notes && item.notes.trim()) {
        lines.push(`Observação: ${item.notes.trim()}`);
      }
      lines.push(`Valor por unidade com adicionais: ${formatPrice(item.unitPriceWithAdditionals)}`);
      lines.push(`Total do item: ${formatPrice(item.totalPrice)}`);
      lines.push('');
    });

    lines.push('RESUMO');
    if (isDelivery) {
      lines.push(`Subtotal dos produtos: ${formatPrice(subtotalCents)}`);
      lines.push('Frete: a informar pelo WhatsApp');
      lines.push('Total com frete: a confirmar');
      lines.push(`Prazo estimado: ${config.deliveryTimeEstimate || 'a confirmar'}`);
      lines.push('');
      lines.push('ENDEREÇO');
      lines.push(`Cidade: ${city.trim()}`);
      lines.push(`Bairro: ${neighborhood.trim()}`);
      lines.push(`Rua: ${street.trim()}`);
      lines.push(`Número: ${noNumber ? 'sem número' : number.trim()}`);
      if (complement.trim()) {
        lines.push(`Complemento: ${complement.trim()}`);
      }
      if (reference.trim()) {
        lines.push(`Referência: ${reference.trim()}`);
      }
    } else {
      lines.push(`Total dos produtos: ${formatPrice(subtotalCents)}`);
      lines.push('Modalidade: retirada');
      lines.push(`Prazo estimado: ${config.pickupTimeEstimate || 'a confirmar'}`);
      if (config.pickupAddress && config.pickupAddress.trim()) {
        lines.push(`Local de retirada: ${config.pickupAddress.trim()}`);
      }
    }

    lines.push('');
    lines.push('PAGAMENTO');
    const paymentObj = enabledPaymentMethods.find((p) => p.id === selectedPaymentId);
    if (paymentObj) {
      lines.push(paymentObj.name);
      if (paymentObj.type === 'dinheiro' && cashChange.trim()) {
        lines.push(`Troco: para ${cashChange.trim()} (sujeito ao total com frete)`);
      }
    } else {
      lines.push('Pagamento a combinar pelo WhatsApp');
    }

    if (generalNotes.trim()) {
      lines.push('');
      lines.push('OBSERVAÇÕES');
      lines.push(generalNotes.trim());
    }

    lines.push('');
    if (isDelivery) {
      lines.push('Pode confirmar a disponibilidade, o valor do frete, o total do pedido e o prazo de entrega, por favor?');
    } else {
      lines.push('Pode confirmar a disponibilidade e o prazo de retirada, por favor?');
    }

    return lines.join('\n');
  };

  // Validate and submit checkout
  const handleFinalizeOrder = async () => {
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.customerName = 'Por favor, informe seu nome.';
    }

    if (fulfillmentType === 'entrega') {
      if (!city.trim()) errors.city = 'Informe a cidade.';
      if (!neighborhood.trim()) errors.neighborhood = 'Informe o bairro.';
      if (!street.trim()) errors.street = 'Informe a rua.';
      if (!noNumber && !number.trim()) errors.number = 'Informe o número ou selecione "Sem número".';

      if (neighborhoodCoverage?.status === 'not_delivered') {
        errors.neighborhood = 'Bairro não atendido para entrega. Escolha "Retirada" para continuar.';
      }
    }

    if (!status.canOrder && !config.acceptOrdersWhenClosed) {
      errors.general = 'O estabelecimento está fechado e não está recebendo pedidos no momento.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsValidating(true);

    try {
      // Rule 11: "Antes de finalizar, verificar preços e disponibilidade atuais. Se houver mudanças, apresentar o resumo atualizado para revisão."
      const res = await fetch('/api/validate-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (!data.valid && data.changes && data.changes.length > 0) {
          setValidationChanges(data.changes);
          onApplyServerValidation(data.items);
          setIsValidating(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Cart pre-validation network fallback:', e);
    } finally {
      setIsValidating(false);
    }

    // Prepare message and show confirmation notice
    const orderText = generateWhatsAppMessage();
    const cleanNumber = (config.whatsappNumber || '5584991537520').replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(orderText)}`;

    setConfirmModalData({
      whatsappUrl,
      orderText,
      isDelivery: fulfillmentType === 'entrega',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-stone-950/70 backdrop-blur-xs flex justify-center sm:justify-end animate-in fade-in"
    >
      {/* No mobile: 100% da tela (largura e altura totais); no desktop (sm:): drawer lateral com max-w-lg */}
      <div className="w-full max-w-full sm:max-w-lg bg-white h-full flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-stone-950 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cart-drawer-title" className="text-lg sm:text-xl font-black">
                {currentStep === 'cart' ? 'Seu Pedido' : 'Finalizar Pedido'}
              </h2>
              <span className="text-xs text-purple-200">
                {items.length} {items.length === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar carrinho"
            className="p-2 text-purple-200 hover:text-white rounded-full hover:bg-purple-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Validation Warning Alert */}
        {validationChanges && validationChanges.length > 0 && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block">Atenção: Houve atualização no cardápio</span>
                <ul className="text-xs list-disc list-inside mt-1 space-y-0.5 text-amber-800">
                  {validationChanges.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
                <p className="text-xs font-semibold mt-2">
                  Por favor, revise seu pedido atualizado antes de enviar.
                </p>
                <button
                  type="button"
                  onClick={() => setValidationChanges(null)}
                  className="mt-2 text-xs font-bold bg-amber-200 px-3 py-1 rounded-md hover:bg-amber-300"
                >
                  Entendi, revisar pedido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-stone-800">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-purple-50 flex items-center justify-center text-purple-400">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <div>
                <p className="text-lg font-bold text-stone-800">Seu carrinho está vazio</p>
                <p className="text-sm text-stone-500 mt-1">
                  Explore nossos deliciosos lanches e cuscuz para começar!
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-sm transition"
              >
                Ver Cardápio
              </button>
            </div>
          ) : currentStep === 'cart' ? (
            /* STEP 1: CART ITEMS LIST */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500 pb-1 border-b border-stone-100">
                <span>Itens no pedido</span>
                {isConfirmingClear ? (
                  <div className="flex items-center gap-2">
                    <span className="text-stone-600 font-medium text-[11px]">Limpar tudo?</span>
                    <button
                      onClick={() => {
                        onClearCart();
                        setIsConfirmingClear(false);
                      }}
                      className="text-rose-600 hover:text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded text-[11px]"
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setIsConfirmingClear(false)}
                      className="text-stone-500 hover:text-stone-700 px-1 py-0.5 text-[11px]"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsConfirmingClear(true)}
                    className="text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar carrinho</span>
                  </button>
                )}
              </div>

              {/* Item Cards */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-stone-900 text-base leading-snug">
                          {item.productName}
                          {item.drinkOption?.sizeName && (
                            <span className="text-xs font-semibold text-purple-700 ml-1">
                              ({item.drinkOption.sizeName})
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-stone-500 font-medium">
                          Preço base: {formatPrice(item.basePrice)}
                        </span>
                      </div>
                      <span className="font-black text-base text-purple-950">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>

                    {/* Customizations summary */}
                    <div className="text-xs space-y-1 text-stone-600 pl-1 border-l-2 border-purple-200">
                      {item.removedIngredients && item.removedIngredients.length > 0 && (
                        <p className="text-rose-700">
                          <strong className="text-stone-700">Retirar:</strong> {item.removedIngredients.join(', ')}
                        </p>
                      )}
                      {item.additionals && item.additionals.length > 0 && (
                        <p className="text-purple-800">
                          <strong className="text-stone-700">Adicionais:</strong>{' '}
                          {item.additionals
                            .map((a) => `${a.quantity}x ${a.name} (+${formatPrice(a.price * a.quantity)})`)
                            .join(', ')}
                        </p>
                      )}
                      {item.notes && item.notes.trim() && (
                        <p className="italic text-stone-600">
                          <strong>Obs:</strong> "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Item controls: edit, qty, remove */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/70">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditItem(item)}
                          className="p-1.5 rounded-lg text-purple-700 hover:bg-purple-100 transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>

                      {/* Quantity buttons */}
                      <div className="flex items-center gap-1 border border-stone-300 rounded-lg bg-white px-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* STEP 2: CHECKOUT FORM */
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setCurrentStep('cart')}
                className="text-xs font-bold text-purple-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Voltar para revisão dos itens
              </button>

              {/* Customer Name */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Como podemos te chamar?"
                  className="w-full p-3 rounded-xl border border-stone-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none text-sm text-stone-900"
                />
                {formErrors.customerName && (
                  <p className="text-xs text-rose-600 mt-1 font-semibold">{formErrors.customerName}</p>
                )}
              </div>

              {/* Fulfillment Type Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1.5">
                  Modalidade de Atendimento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!config.deliveryEnabled}
                    onClick={() => setFulfillmentType('entrega')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition cursor-pointer ${
                      fulfillmentType === 'entrega'
                        ? 'border-purple-700 bg-purple-50 text-purple-950 ring-2 ring-purple-400'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-purple-200'
                    } ${!config.deliveryEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Bike className="w-4 h-4 text-purple-700" />
                    <span>Entrega</span>
                  </button>

                  <button
                    type="button"
                    disabled={!config.pickupEnabled}
                    onClick={() => setFulfillmentType('retirada')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition cursor-pointer ${
                      fulfillmentType === 'retirada'
                        ? 'border-purple-700 bg-purple-50 text-purple-950 ring-2 ring-purple-400'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-purple-200'
                    } ${!config.pickupEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Store className="w-4 h-4 text-purple-700" />
                    <span>Retirada</span>
                  </button>
                </div>
              </div>

              {/* Delivery Address Form */}
              {fulfillmentType === 'entrega' ? (
                <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                    <Bike className="w-4 h-4 text-purple-700" />
                    <span>Endereço de Entrega</span>
                  </div>

                  {/* MANDATORY FREIGHT NOTICE */}
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="font-semibold leading-relaxed">
                      O valor do frete será informado pelo WhatsApp após a confirmação do endereço.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: Morroró"
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                      />
                      {formErrors.city && (
                        <p className="text-[11px] text-rose-600 font-semibold">{formErrors.city}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Ex: Ponta Negra"
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                      />
                      {formErrors.neighborhood && (
                        <p className="text-[11px] text-rose-600 font-semibold">{formErrors.neighborhood}</p>
                      )}
                    </div>
                  </div>

                  {/* Neighborhood coverage notification */}
                  {neighborhoodCoverage && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-medium ${
                        neighborhoodCoverage.status === 'not_delivered'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : neighborhoodCoverage.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-purple-50 text-purple-900 border border-purple-200'
                      }`}
                    >
                      {neighborhoodCoverage.message}
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      Rua / Avenida *
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ex: Rua das Flores"
                      className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                    />
                    {formErrors.street && (
                      <p className="text-[11px] text-rose-600 font-semibold">{formErrors.street}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        disabled={noNumber}
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder={noNumber ? 'Sem número' : 'Ex: 120'}
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm disabled:bg-stone-100 disabled:text-stone-400"
                      />
                      {formErrors.number && !noNumber && (
                        <p className="text-[11px] text-rose-600 font-semibold">{formErrors.number}</p>
                      )}
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={noNumber}
                          onChange={(e) => {
                            setNoNumber(e.target.checked);
                            if (e.target.checked) setNumber('');
                          }}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 cursor-pointer"
                        />
                        <span>Sem número</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">
                        Complemento (opcional)
                      </label>
                      <input
                        type="text"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        placeholder="Apto, Bloco, Casa B"
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">
                        Ponto de referência (opcional)
                      </label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Próximo à praça..."
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Pickup info */
                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                    <Store className="w-4 h-4 text-purple-700" />
                    <span>Retirada no Balcão</span>
                  </div>
                  {config.pickupAddress && config.pickupAddress.trim() ? (
                    <p className="text-xs text-stone-700">
                      <strong>Endereço da loja:</strong> {config.pickupAddress}
                    </p>
                  ) : null}
                  <p className="text-xs text-stone-600">
                    O tempo de preparo estimado para retirada é de{' '}
                    <strong>{config.pickupTimeEstimate || 'a confirmar pelo WhatsApp'}</strong>.
                  </p>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1.5">
                  Forma de Pagamento *
                </label>
                {enabledPaymentMethods.length === 0 ? (
                  <p className="text-xs text-stone-600 bg-stone-100 p-2.5 rounded-lg">
                    Pagamento a combinar pelo WhatsApp
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {enabledPaymentMethods.map((pm) => (
                      <label
                        key={pm.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition cursor-pointer ${
                          selectedPaymentId === pm.id
                            ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="payment"
                            value={pm.id}
                            checked={selectedPaymentId === pm.id}
                            onChange={() => setSelectedPaymentId(pm.id)}
                            className="text-purple-600 focus:ring-purple-400"
                          />
                          <PaymentIcon type={pm.type || pm.id} className="w-5 h-4 shrink-0" />
                          <span>{pm.name}</span>
                        </div>
                        {pm.details && (
                          <span className="text-[11px] text-stone-500 font-normal">
                            {pm.details}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Cash change field if cash selected */}
              {enabledPaymentMethods.find((p) => p.id === selectedPaymentId)?.type === 'dinheiro' && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    Precisa de troco? Para quanto?
                  </label>
                  <input
                    type="text"
                    value={cashChange}
                    onChange={(e) => setCashChange(e.target.value)}
                    placeholder="Ex: Troco para R$ 50,00 ou Não preciso"
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                  />
                  {fulfillmentType === 'entrega' && (
                    <p className="text-[11px] text-stone-500 mt-1">
                      * O valor do troco será confirmado após a definição do frete pelo WhatsApp.
                    </p>
                  )}
                </div>
              )}

              {/* General Order Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                  Observações Gerais do Pedido (opcional)
                </label>
                <textarea
                  rows={2}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Alguma instrução especial para o entregador ou para a cozinha..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm outline-none resize-none"
                />
              </div>

              {formErrors.general && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {formErrors.general}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Totals and Actions */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 space-y-3">
            {/* Totals Breakdown according to Strict Rules */}
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-stone-700">
                <span className="font-medium">Subtotal dos produtos:</span>
                <span className="font-extrabold text-stone-900 text-base">
                  {formatPrice(subtotalCents)}
                </span>
              </div>

              {fulfillmentType === 'entrega' ? (
                <>
                  <div className="flex items-center justify-between text-stone-600 text-xs">
                    <span>Frete:</span>
                    <span className="font-bold text-purple-900">
                      informado pelo WhatsApp
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-stone-200">
                    <span className="font-black text-stone-900 text-base">
                      Total com frete:
                    </span>
                    <span className="font-black text-amber-700 text-base">
                      a confirmar pelo WhatsApp
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between pt-1.5 border-t border-stone-200">
                  <span className="font-black text-stone-900 text-base">
                    Total dos produtos:
                  </span>
                  <span className="font-black text-purple-950 text-xl">
                    {formatPrice(subtotalCents)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {currentStep === 'cart' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 transition text-sm cursor-pointer"
                >
                  Continuar comprando
                </button>
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="flex-1 min-h-[48px] py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-stone-950 font-black text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Avançar para Dados</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('cart')}
                  className="px-4 py-3 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 transition text-sm cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={isValidating}
                  onClick={handleFinalizeOrder}
                  className="flex-1 min-h-[48px] py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-stone-950 font-black text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isValidating ? (
                    <span>Verificando...</span>
                  ) : (
                    <>
                      <span>Finalizar no WhatsApp</span>
                      <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Drink Upsell Modal */}
        {showUpsell && (
          <DrinkUpsellModal
            availableDrinks={availablePricedDrinks}
            onSelectDrink={handleSelectUpsellDrink}
            onContinueWithoutDrink={handleContinueWithoutDrink}
          />
        )}

        {/* WhatsApp Final Confirm Modal */}
        {confirmModalData && (
          <WhatsAppConfirmModal
            whatsappUrl={confirmModalData.whatsappUrl}
            orderText={confirmModalData.orderText}
            isDelivery={confirmModalData.isDelivery}
            onClose={() => setConfirmModalData(null)}
          />
        )}
      </div>
    </div>
  );
};
