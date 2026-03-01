// src/integrations/supabase/client.ts

// A more robust mock for Supabase to prevent "is not a function" errors when chaining.
const mockChain = () => {
  const proxy: any = new Proxy({}, {
    get: (target, prop) => {
      if (prop === 'then') {
        return (resolve: any) => resolve({ data: [], error: null });
      }
      if (typeof prop === 'string') {
        return () => proxy;
      }
      return (target as any)[prop];
    }
  });
  return proxy;
};

export const supabase = {
  from: () => ({
    select: mockChain,
    insert: mockChain,
    update: mockChain,
    upsert: mockChain,
    delete: mockChain,
    eq: mockChain,
    order: mockChain,
    limit: mockChain,
    single: mockChain,
    maybeSingle: mockChain,
    range: mockChain,
    match: mockChain,
    filter: mockChain,
    or: mockChain,
    in: mockChain,
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: () => Promise.resolve({ data: { user: { id: 'mock' } }, error: null }),
    signUp: () => Promise.resolve({ data: { user: { id: 'mock' } }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
    updateUser: () => Promise.resolve({ data: { user: {} }, error: null }),
  },
  functions: {
    invoke: () => Promise.resolve({ data: { reply: "I am a mock assistant." }, error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: {}, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  }
} as any;
