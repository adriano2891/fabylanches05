import React from 'react';

interface FabyLogoProps {
  customUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const OFFICIAL_LOGO_LOCAL = '/logo_oficial.png';
export const OFFICIAL_LOGO_FALLBACK = '/logo_oficial.png';

export const FabyLogo: React.FC<FabyLogoProps> = ({ customUrl, className = '', size = 'lg' }) => {
  // Use customUrl if provided and not pointing to the old black JPG; otherwise use OFFICIAL_LOGO_LOCAL
  const isOldBlackJpg = customUrl && (customUrl.includes('IMG-20261016-WA0070.jpg') || customUrl.includes('logo_oficial.jpg') || customUrl.includes('logo_from_ibb.jpg'));
  const logoSrc = customUrl && customUrl.trim() !== '' && !isOldBlackJpg ? customUrl : OFFICIAL_LOGO_LOCAL;

  const sizeClasses = {
    sm: 'h-10 sm:h-12 md:h-14 w-auto max-w-[140px]',
    md: 'h-14 sm:h-18 md:h-22 w-auto max-w-[190px]',
    // Enlarged for visual impact while using negative vertical margin to avoid altering the header bar height
    lg: 'h-[78px] xs:h-[84px] sm:h-[88px] md:h-[98px] -my-2 xs:-my-2.5 sm:-my-3 w-auto max-w-[155px] xs:max-w-[175px] sm:max-w-[240px] md:max-w-[280px]',
    xl: 'h-24 sm:h-32 md:h-40 w-auto max-w-[340px]',
  }[size];

  const isDefaultOfficialLogo = !customUrl || customUrl === OFFICIAL_LOGO_LOCAL || customUrl === '/logo_oficial.webp' || customUrl.includes('logo_oficial');

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none bg-transparent overflow-visible p-0 ${className}`}>
      {isDefaultOfficialLogo ? (
        <picture className="inline-flex items-center justify-center">
          <source
            type="image/webp"
            srcSet="/logo_oficial_sm.webp 280w, /logo_oficial.webp 500w"
            sizes="(max-width: 640px) 155px, 260px"
          />
          <img
            src={OFFICIAL_LOGO_LOCAL}
            alt="Faby Lanches - Logo Oficial"
            width="260"
            height="110"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className={`object-contain bg-transparent transition-all duration-200 drop-shadow-md hover:drop-shadow-xl ${sizeClasses}`}
          />
        </picture>
      ) : (
        <img
          src={logoSrc}
          alt="Faby Lanches - Logo Oficial"
          width="260"
          height="110"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== OFFICIAL_LOGO_LOCAL) {
              target.src = OFFICIAL_LOGO_LOCAL;
            }
          }}
          className={`object-contain bg-transparent transition-all duration-200 drop-shadow-md hover:drop-shadow-xl ${sizeClasses}`}
        />
      )}
    </div>
  );
};
