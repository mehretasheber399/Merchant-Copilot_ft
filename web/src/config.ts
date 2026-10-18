function requiredUrl(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Missing ${name}`);
  }
  return value.replace(/\/$/, '');
}

function requiredFlag(name: string, value: string | undefined): boolean {
  if (value !== 'true' && value !== 'false') {
    throw new Error(`${name} must be "true" or "false"`);
  }
  return value === 'true';
}

export const config = {
  apiBaseUrl: requiredUrl('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  demoTools: requiredFlag('VITE_DEMO_TOOLS', import.meta.env.VITE_DEMO_TOOLS),
};

export const REQUEST_TIMEOUT_MS = 15_000;
