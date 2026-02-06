import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server for Node.js testing (Jest, Vitest, etc.)
export const server = setupServer(...handlers);

export default server;
