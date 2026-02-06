interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton?: (
    element: HTMLElement,
    options?: { theme?: string; size?: string; type?: string }
  ) => void;
  prompt?: () => void;
}

interface GoogleAccounts {
  accounts: {
    id: GoogleAccountsId;
  };
}

interface Window {
  google: GoogleAccounts;
}

/// <reference types="@testing-library/jest-dom" />