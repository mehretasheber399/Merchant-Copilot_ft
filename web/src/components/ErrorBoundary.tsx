import { Component, type ReactNode } from 'react';
import i18n from '../i18n';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="mx-auto grid min-h-dvh w-full max-w-[420px] content-center gap-4 px-4"
        >
          <h1 className="text-2xl font-semibold">{i18n.t('errors:title')}</h1>
          <button
            type="button"
            className="min-h-control rounded-control bg-primary px-4 font-semibold text-primary-foreground"
            onClick={() => this.setState({ error: null })}
          >
            {i18n.t('errors:retry')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
