import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Sheet } from '../../components/ui/Sheet';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import i18n from '../../i18n';
import type { ProductView } from '../../shared/types';
import {
  draftFromProduct,
  emptyDraft,
  validateDraft,
  type FieldError,
  type ItemDraft,
} from './form';

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

export function ProductFormSheet({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product: ProductView | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('items');
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [errors, setErrors] = useState<ReturnType<typeof validateDraft>['errors']>({});
  const [serverError, setServerError] = useState('');
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(product ? draftFromProduct(product) : emptyDraft());
    setErrors({});
    setServerError('');
  }, [open, product]);

  const setField = (field: keyof ItemDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const message = (field: 'name' | 'price', code: FieldError | undefined) => {
    if (!code) {
      return undefined;
    }
    if (code === 'integer') {
      return t('integerOnly');
    }
    return field === 'name' ? t('nameRequired') : t('priceRequired');
  };

  const optionalMessage = (code: FieldError | undefined) =>
    code === 'integer' ? t('integerOnly') : undefined;

  const onSave = () => {
    const validated = validateDraft(draft, { keepEmptyNameAm: Boolean(product?.nameAm) });
    setErrors(validated.errors);
    if (!validated.input) {
      return;
    }
    setServerError('');
    const saved = product
      ? update.mutateAsync({ id: product.id, patch: validated.input })
      : create.mutateAsync(validated.input);
    void saved.then(() => onClose()).catch((error: unknown) => setServerError(errorText(error)));
  };

  return (
    <Sheet open={open} title={product ? t('edit') : t('add')} onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <Input
          label={t('name')}
          value={draft.name}
          maxLength={80}
          onChange={(event) => setField('name', event.target.value)}
          error={message('name', errors.name)}
        />
        <Input
          label={t('nameAm')}
          value={draft.nameAm}
          maxLength={80}
          onChange={(event) => setField('nameAm', event.target.value)}
        />
        <Input
          label={t('price')}
          inputMode="numeric"
          value={draft.price}
          onChange={(event) => setField('price', event.target.value)}
          error={message('price', errors.price)}
        />
        <Input
          label={t('cost')}
          inputMode="numeric"
          hint={t('costHelp')}
          value={draft.cost}
          onChange={(event) => setField('cost', event.target.value)}
          error={optionalMessage(errors.cost)}
        />
        <Input
          label={t('stock')}
          inputMode="numeric"
          hint={t('stockHelp')}
          value={draft.stock}
          onChange={(event) => setField('stock', event.target.value)}
          error={optionalMessage(errors.stock)}
        />
        <Input
          label={t('threshold')}
          inputMode="numeric"
          value={draft.reorderThreshold}
          onChange={(event) => setField('reorderThreshold', event.target.value)}
          error={optionalMessage(errors.reorderThreshold)}
        />
        {serverError ? (
          <p role="alert" className="text-sm font-semibold text-danger">
            {serverError}
          </p>
        ) : null}
        <Button type="submit" loading={saving}>
          {t('save')}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
      </form>
    </Sheet>
  );
}
