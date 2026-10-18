import type { ToastTone } from '../shared/types';

export interface WebHostDeps {
  navigate: (path: string) => void;
  logout: () => void;
  toast: (message: string, tone?: ToastTone) => void;
  businessName: string;
}

export class WebHost {
  constructor(private readonly deps: WebHostDeps) {}

  navigate(path: string) {
    this.deps.navigate(path);
  }

  logout() {
    this.deps.logout();
  }

  toast(message: string, tone?: ToastTone) {
    this.deps.toast(message, tone);
  }

  getBusinessName() {
    return this.deps.businessName;
  }
}
