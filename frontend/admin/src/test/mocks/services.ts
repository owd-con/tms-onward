import { vi } from 'vitest';

// Mock baseQuery
vi.mock('@/services/baseQuery', () => ({
  baseQuery: vi.fn(() => async () => ({
    data: {},
    error: null,
  })),
}));

// Mock useEnigmaUI hook
vi.mock('@/components/enigma/useEnigmaUI', async () => {
  const actual = await vi.importActual('@/components/enigma/useEnigmaUI');
  return {
    ...actual,
    useEnigmaUI: () => ({
      openModal: vi.fn(),
      closeModal: vi.fn(),
      openDrawer: vi.fn(),
      closeDrawer: vi.fn(),
      showToast: vi.fn(),
      hideToast: vi.fn(),
      toasts: {},
      state: {
        modal: null,
        drawer: null,
      },
    }),
  };
});
