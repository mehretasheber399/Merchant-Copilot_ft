import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { useApplyStarter, useProductList, useStarterTemplate } from '../../hooks/useProducts';
import i18n from '../../i18n';
import { displayName, starterRows, starterSubmit, type StarterRow } from './form';
import { useLocaleStore } from '../../store/locale';

function errorText(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return i18n.t('errors:generic');
  }
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' || error.status === 0) {
    return i18n.t('errors:network');
  }
  if (error.status === 429 || error.code === 'RATE_LIMITED') {
    return i18n.t('errors:rateLimited');
  }
  if (error.code === 'VALIDATION_ERROR' && error.issues.length > 0) {
    return error.issues.map((issue) => issue.message).join(' ');
  }
  return i18n.t('errors:generic');
}

export function StarterSheet({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { t } = useTranslation('items');
  const locale = useLocaleStore((state) => state.locale);
  const template = useStarterTemplate(open);
  const catalog = useProductList('');
  const apply = useApplyStarter();
  const [rows, setRows] = useState<StarterRow[]>([]);
  const [problem, setProblem] = useState('');
  const busy = apply.isPending;

  useEffect(() => {
    if (open && template.data && catalog.data) {
      setRows(
        starterRows(
          template.data,
          catalog.data.map((product) => product.name),
        ),
      );
      setProblem('');
    }
  }, [open, template.data, catalog.data]);

  const updateRow = (index: number, patch: Partial<StarterRow>) => {
    setRows((current) => current.map((row) => (row.index === index ? { ...row, ...patch } : row)));
  };

  const onApply = () => {
    const submission = starterSubmit(rows);
    if (submission.kind === 'empty') {
      setProblem(t('selectOne'));
      return;
    }
    if (submission.kind === 'invalid') {
      setProblem(t('integerOnly'));
      return;
    }
    setProblem('');
    void (async () => {
      try {
        let created = 0;
        let skipped = 0;
        for (const call of submission.calls) {
          const result = await apply.mutateAsync(call);
          created += result.created;
          skipped += result.skipped;
        }
        onDone(t('createdSkipped', { created, skipped }));
        onClose();
      } catch (error: unknown) {
        setProblem(errorText(error));
      }
    })();
  };

  return (
    <Sheet open={open} title={t('starterTitle')} onClose={onClose}>
      {template.isPending || catalog.isPending ? (
        <p role="status">{i18n.t('common:loading')}</p>
      ) : null}
      {template.isError ? (
        <div className="grid gap-3">
          <p role="alert">{errorText(template.error)}</p>
          <Button onClick={() => void template.refetch()}>{i18n.t('errors:retry')}</Button>
        </div>
      ) : null}
      {template.data && catalog.data && rows.length === 0 ? <p>{t('starterEmpty')}</p> : null}
      {rows.length > 0 ? (
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                setRows((current) =>
                  current.map((row) => ({ ...row, selected: row.alreadyAdded ? false : true })),
                )
              }
            >
              {t('selectAll')}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setRows((current) => current.map((row) => ({ ...row, selected: false })))
              }
            >
              {t('selectNone')}
            </Button>
          </div>
          <ul className="grid gap-3">
            {rows.map((row) => {
              const name = displayName(row, locale);
              return (
                <li
                  key={row.index}
                  className={`grid gap-2 rounded-card border border-line p-3 ${row.alreadyAdded ? 'text-muted' : ''}`}
                >
                  <label className="flex min-h-control items-center gap-3 font-semibold">
                    <input
                      type="checkbox"
                      className="h-6 w-6"
                      checked={row.selected && !row.alreadyAdded}
                      disabled={row.alreadyAdded}
                      onChange={(event) => updateRow(row.index, { selected: event.target.checked })}
                    />
                    <span className="min-w-0 flex-1">{name}</span>
                    {row.alreadyAdded ? (
                      <span className="text-sm font-semibold">{t('alreadyAdded')}</span>
                    ) : null}
                  </label>
                  <label className="grid gap-1 text-sm font-semibold">
                    {t('price')}
                    <input
                      className="min-h-control rounded-control border border-line px-3 text-base font-normal disabled:opacity-60"
                      inputMode="numeric"
                      aria-label={`${t('price')} ${name}`}
                      value={row.price}
                      disabled={row.alreadyAdded}
                      onChange={(event) => updateRow(row.index, { price: event.target.value })}
                    />
                  </label>
                </li>
              );
            })}
          </ul>
          {problem ? (
            <p role="alert" className="text-sm font-semibold text-danger">
              {problem}
            </p>
          ) : null}
          <Button onClick={onApply} loading={busy}>
            {t('apply')}
          </Button>
        </div>
      ) : null}
    </Sheet>
  );
}
