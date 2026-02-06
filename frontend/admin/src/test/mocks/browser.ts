// Lazy-load browser MSW worker to avoid issues in Node.js test environment
// This file should only be imported in browser context

export const getWorker = async () => {
  if (typeof window === 'undefined') {
    throw new Error('setupWorker can only be used in browser environment');
  }
  const { setupWorker } = await import('msw/browser');
  const { handlers } = await import('./handlers');
  return setupWorker(...handlers);
};

export default getWorker;
