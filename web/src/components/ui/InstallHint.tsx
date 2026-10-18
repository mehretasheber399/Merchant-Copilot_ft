import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
}

function installed(): boolean {
  const standalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const ios =
    'standalone' in navigator && Boolean((navigator as { standalone?: boolean }).standalone);
  return standalone || ios;
}

export function InstallHint() {
  const { t } = useTranslation('common');
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [hidden, setHidden] = useState(installed);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (hidden) {
    return null;
  }

  return (
    <div className="mb-4 grid gap-2 rounded-card border border-line bg-canvas p-3">
      <p>{t('installHint')}</p>
      <div className="grid gap-2">
        {prompt ? (
          <Button
            onClick={() => {
              void prompt.prompt().finally(() => setHidden(true));
            }}
          >
            {t('install')}
          </Button>
        ) : null}
        <Button variant="secondary" onClick={() => setHidden(true)}>
          {t('close')}
        </Button>
      </div>
    </div>
  );
}
