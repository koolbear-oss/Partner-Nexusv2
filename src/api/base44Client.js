import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "691e37002d2982f5612178aa", 
  requiresAuth: true // Ensure authentication is required for all operations
});
