import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { t } = useTranslation('common');
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div
      role="status"
      className="bg-warning-soft px-4 py-3 text-center text-sm font-semibold text-warning"
    >
      {t('offline')}
    </div>
  );
}
