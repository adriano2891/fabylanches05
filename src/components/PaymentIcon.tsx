import React from 'react';

interface PaymentIconProps {
  type?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Ícones oficiais padronizados para formas de pagamento:
 * - Pix (Logo oficial do Banco Central do Brasil - #32BCAD)
 * - Cartão de Crédito (Bandeiras oficiais Mastercard e Visa)
 * - Cartão de Débito (Cartão com chip EMV e ondas de aproximação)
 * - Dinheiro (Cédula do Real R$ verde esmeralda com acabamento de cédula)
 *
 * Todos padronizados na proporção de proporção bancária (28x18), responsivos e alinhados.
 */

export const PixOfficialIcon: React.FC<{ className?: string; sizeClass?: string }> = ({
  className = '',
  sizeClass = 'w-7 h-[18px]',
}) => (
  <svg
    role="img"
    viewBox="0 0 28 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 inline-block align-middle transition-transform ${sizeClass} ${className}`}
    aria-label="Pix - Banco Central do Brasil"
  >
    <rect width="28" height="18" rx="3.5" fill="#0A3B37" />
    <g transform="translate(4, 1.5) scale(0.62)">
      <path
        d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156"
        fill="#32BCAD"
      />
    </g>
    <text x="21" y="11.5" fill="#32BCAD" fontSize="5.5" fontWeight="900" fontFamily="system-ui, sans-serif">pix</text>
  </svg>
);

export const MastercardOfficialIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-[18px]' }) => (
  <svg
    viewBox="0 0 28 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 inline-block align-middle ${className}`}
    aria-label="Mastercard"
  >
    <rect width="28" height="18" rx="3.5" fill="#141824" stroke="#2D3748" strokeWidth="0.5" />
    <circle cx="11" cy="9" r="5.2" fill="#EB001B" />
    <circle cx="17" cy="9" r="5.2" fill="#F79E1B" />
    <path
      d="M14 5.6A5.2 5.2 0 0 0 11.8 9c0 1.35.48 2.58 1.28 3.55a5.2 5.2 0 0 0 2.14-3.55A5.2 5.2 0 0 0 14 5.6z"
      fill="#FF5F00"
    />
  </svg>
);

export const VisaOfficialIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-[18px]' }) => (
  <svg
    viewBox="0 0 28 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 inline-block align-middle ${className}`}
    aria-label="Visa"
  >
    <rect width="28" height="18" rx="3.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.5" />
    <path
      d="M10.8 13.5L8.5 5H6.7L4.9 11.1C4.8 11.4 4.7 11.6 4.4 11.7C3.5 12.2 2.6 12.5 1.7 12.7L1.8 13.5H6.2C6.9 13.5 7.4 13 7.6 12.2L8.7 6.7L11.1 13.5H10.8ZM18.8 9.6C18.8 7.7 16.1 7.6 16.1 6.7C16.1 6.4 16.4 6.1 17 6C17.3 5.9 18.2 5.9 19.1 6.3L19.5 4.7C19 4.5 18.3 4.3 17.4 4.3C15.3 4.3 13.9 5.4 13.9 7C13.9 8.2 14.9 8.9 15.7 9.3C16.5 9.7 16.8 10 16.8 10.3C16.8 10.8 16.1 11.1 15.5 11.1C14.5 11.1 13.8 10.8 13.4 10.6L12.9 12.2C13.5 12.5 14.4 12.7 15.4 12.7C17.7 12.7 19.1 11.5 18.8 9.6ZM24.3 13.5H26.3L24.6 5H22.9C22.4 5 22 5.2 21.8 5.7L18.6 13.5H21.1L21.6 12.1H24.1L24.3 13.5ZM22.2 10.5L23.4 7.3L23.9 10.5H22.2ZM15.4 5L13.5 13.5H11.5L13.4 5H15.4Z"
      fill="#1434CB"
    />
  </svg>
);

export const CreditCardOfficialBadge: React.FC<{ className?: string; sizeClass?: string }> = ({
  className = '',
  sizeClass = 'w-7 h-[18px]',
}) => (
  <svg
    viewBox="0 0 28 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 inline-block align-middle ${sizeClass} ${className}`}
    aria-label="Cartão de Crédito - Visa e Mastercard"
  >
    {/* Card Body */}
    <rect width="28" height="18" rx="3.5" fill="#1E1B4B" stroke="#4338CA" strokeWidth="0.5" />
    {/* Chip EMV */}
    <rect x="3.5" y="5" width="4.5" height="3.5" rx="0.8" fill="#FBBF24" stroke="#B45309" strokeWidth="0.3" />
    <line x1="3.5" y1="6.8" x2="8" y2="6.8" stroke="#B45309" strokeWidth="0.3" />
    <line x1="5.7" y1="5" x2="5.7" y2="8.5" stroke="#B45309" strokeWidth="0.3" />
    {/* Contactless waves */}
    <path d="M10 6C10.5 6.7 10.5 7.8 10 8.5M11.5 5C12.3 6.1 12.3 8.9 11.5 10" stroke="#93C5FD" strokeWidth="0.8" strokeLinecap="round" />
    {/* Mastercard Mini Logo on Bottom Right */}
    <circle cx="20" cy="12.5" r="3.2" fill="#EB001B" />
    <circle cx="23.5" cy="12.5" r="3.2" fill="#F79E1B" opacity="0.9" />
    <path d="M21.75 10.3A3.2 3.2 0 0 0 20.4 12.5a3.2 3.2 0 0 0 1.35 2.2 3.2 3.2 0 0 0 1.35-2.2 3.2 3.2 0 0 0-1.35-2.2z" fill="#FF5F00" />
    {/* Card Label */}
    <text x="3.5" y="14.5" fill="#E0E7FF" fontSize="3.2" fontWeight="800" fontFamily="system-ui, sans-serif">CRÉDITO</text>
  </svg>
);

export const DebitCardOfficialBadge: React.FC<{ className?: string; sizeClass?: string }> = ({
  className = '',
  sizeClass = 'w-7 h-[18px]',
}) => (
  <svg
    viewBox="0 0 28 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 inline-block align-middle ${sizeClass} ${className}`}
    aria-label="Cartão de Débito"
  >
    {/* Card Body in Ocean Cyan/Navy */}
    <rect width="28" height="18" rx="3.5" fill="#0369A1" stroke="#0284C7" strokeWidth="0.5" />
    {/* Chip EMV */}
    <rect x="3.5" y="5" width="4.5" height="3.5" rx="0.8" fill="#FCD34D" stroke="#B45309" strokeWidth="0.3" />
    <line x1="3.5" y1="6.8" x2="8" y2="6.8" stroke="#B45309" strokeWidth="0.3" />
    <line x1="5.7" y1="5" x2="5.7" y2="8.5" stroke="#B45309" strokeWidth="0.3" />
    {/* Contactless waves */}
    <path d="M10 6C10.5 6.7 10.5 7.8 10 8.5M11.5 5C12.3 6.1 12.3 8.9 11.5 10" stroke="#BAE6FD" strokeWidth="0.8" strokeLinecap="round" />
    {/* Maestro-style interlock or Débito branding */}
    <circle cx="21" cy="7" r="3" fill="#EF4444" opacity="0.9" />
    <circle cx="24.2" cy="7" r="3" fill="#3B82F6" opacity="0.9" />
    {/* Text Label */}
    <text x="3.5" y="14.5" fill="#FFFFFF" fontSize="3.6" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="0.4">DÉBITO</text>
  </svg>
);

export const CashOfficialBadge: React.FC<{ className?: string; sizeClass?: string }> = ({
  className = '',
  sizeClass = 'w-7 h-[18px]',
}) => (
  <svg
    viewBox="0 0 28 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 inline-block align-middle ${sizeClass} ${className}`}
    aria-label="Dinheiro em Espécie (R$ Real)"
  >
    {/* Real Banknote Body */}
    <rect width="28" height="18" rx="2.5" fill="#047857" stroke="#10B981" strokeWidth="0.6" />
    <rect x="2" y="2" width="24" height="14" rx="1.5" stroke="#6EE7B7" strokeWidth="0.6" strokeDasharray="1.5 1" />
    {/* Central Rosette */}
    <circle cx="14" cy="9" r="4.5" fill="#065F46" stroke="#A7F3D0" strokeWidth="0.6" />
    <text
      x="14"
      y="11.8"
      textAnchor="middle"
      fill="#ECFDF5"
      fontSize="6"
      fontWeight="900"
      fontFamily="system-ui, sans-serif"
    >
      R$
    </text>
    {/* Corner Marks */}
    <circle cx="4.5" cy="4.5" r="0.8" fill="#A7F3D0" />
    <circle cx="23.5" cy="4.5" r="0.8" fill="#A7F3D0" />
    <circle cx="4.5" cy="13.5" r="0.8" fill="#A7F3D0" />
    <circle cx="23.5" cy="13.5" r="0.8" fill="#A7F3D0" />
  </svg>
);

export const PaymentIcon: React.FC<PaymentIconProps> = ({ type, className = '', size = 'md' }) => {
  const normalized = (type || '').toLowerCase().trim();

  // Consistent sizing classes
  const sizeClasses = {
    sm: 'w-6 h-[15px]',
    md: 'w-7 h-[18px]',
    lg: 'w-8 h-[21px]',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  if (normalized === 'pix') {
    return <PixOfficialIcon className={className} sizeClass={selectedSize} />;
  }

  if (normalized === 'cartao_credito' || normalized.includes('crédito') || normalized.includes('credito')) {
    return <CreditCardOfficialBadge className={className} sizeClass={selectedSize} />;
  }

  if (normalized === 'cartao_debito' || normalized.includes('débito') || normalized.includes('debito')) {
    return <DebitCardOfficialBadge className={className} sizeClass={selectedSize} />;
  }

  if (normalized === 'dinheiro' || normalized.includes('dinheiro') || normalized.includes('cash')) {
    return <CashOfficialBadge className={className} sizeClass={selectedSize} />;
  }

  // Fallback padrão estandardizado para qualquer outra modalidade
  return (
    <svg
      viewBox="0 0 28 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 inline-block align-middle ${selectedSize} ${className}`}
    >
      <rect width="28" height="18" rx="2.5" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
      <rect x="0" y="4" width="28" height="3" fill="#1F2937" />
      <circle cx="5" cy="13" r="1.8" fill="#FBBF24" />
      <text x="11" y="14.5" fill="#E5E7EB" fontSize="3.5" fontWeight="700" fontFamily="system-ui, sans-serif">CARD</text>
    </svg>
  );
};

