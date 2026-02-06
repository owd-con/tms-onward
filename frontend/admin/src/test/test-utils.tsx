import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PreloadedState, Store } from '@reduxjs/toolkit';
import { EnigmaProvider } from '@/components/enigma/provider';
import { store, type RootState } from '@/services/store';

// Mock store
export function createMockStore(preloadedState?: PreloadedState<RootState>) {
  return store;
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  store?: Store;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = createMockStore(preloadedState),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <EnigmaProvider>
            {children}
          </EnigmaProvider>
        </BrowserRouter>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Mock session
export const mockSession = {
  user_id: 'test-user-id',
  company_id: 'test-company-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'Admin' as const,
  exp: Date.now() / 1000 + 3600,
};

// Re-export everything from RTL
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
