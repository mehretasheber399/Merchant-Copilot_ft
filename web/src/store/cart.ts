import { create } from 'zustand';
import { nextQty } from '../features/sale/logic';

export interface CartLine {
  productId: string;
  price: number;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  limitReached: boolean;
  add: (productId: string, price: number) => void;
  change: (productId: string, delta: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  limitReached: false,
  add: (productId, price) =>
    set((state) => {
      const existing = state.lines.find((line) => line.productId === productId);
      if (existing) {
        return {
          limitReached: false,
          lines: state.lines.map((line) =>
            line.productId === productId ? { ...line, price, qty: nextQty(line.qty, 1) } : line,
          ),
        };
      }
      if (state.lines.length >= 30) {
        return { ...state, limitReached: true };
      }
      return {
        limitReached: false,
        lines: [...state.lines, { productId, price, qty: 1 }],
      };
    }),
  change: (productId, delta) =>
    set((state) => ({
      limitReached: false,
      lines: state.lines
        .map((line) =>
          line.productId === productId ? { ...line, qty: nextQty(line.qty, delta) } : line,
        )
        .filter((line) => line.qty > 0),
    })),
  clear: () => set({ lines: [], limitReached: false }),
}));
