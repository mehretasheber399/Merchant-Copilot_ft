import { useTranslation } from 'react-i18next';
import { SantimClip } from '../../components/SantimClip';

export function SaleHero() {
  const { t } = useTranslation('sale');

  return (
    <figure className="relative mb-4 h-[210px] overflow-hidden rounded-[19px] bg-[#120d06] shadow-shell">
      <SantimClip className="absolute inset-0 h-full w-full object-cover object-[50%_35%]" />
      <figcaption className="absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-[rgba(10,20,14,0.78)] to-transparent px-[18px] pb-3.5 pt-8 text-white">
        <p className="text-[19px] font-bold leading-tight">{t('heroTitle')}</p>
        <p className="mt-0.5 text-[13px]">{t('heroCaption')}</p>
      </figcaption>
    </figure>
  );
}
