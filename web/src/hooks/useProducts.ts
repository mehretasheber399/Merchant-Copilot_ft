import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyStarterTemplate,
  bulkCreateProducts,
  createProduct,
  deleteProduct,
  getStarterTemplate,
  listProducts,
  updateProduct,
} from '../api/endpoints';
import type { CreateProductInput, UpdateProductInput } from '../shared/types';

export function useProductList(search: string) {
  return useQuery({
    queryKey: ['products', search],
    queryFn: () => listProducts({ search: search || undefined, limit: 100, activeOnly: true }),
  });
}

export function useStarterTemplate(enabled: boolean) {
  return useQuery({
    queryKey: ['starter-template'],
    queryFn: getStarterTemplate,
    enabled,
  });
}

function useInvalidateProducts() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['products'] });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: { id: string; patch: UpdateProductInput }) =>
      updateProduct(input.id, input.patch),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: invalidate,
  });
}

export function useApplyStarter() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: { items: Array<number | string>; overrides?: { price?: number } }) =>
      applyStarterTemplate(input),
    onSuccess: invalidate,
  });
}

export function useBulkProducts() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (items: CreateProductInput[]) => bulkCreateProducts(items),
    onSuccess: invalidate,
  });
}
