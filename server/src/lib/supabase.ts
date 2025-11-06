import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | any;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createSupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
} else {
  console.warn('Warning: SUPABASE_URL or SUPABASE_ANON_KEY not set. Using a stub supabase client for local development.');

  // Minimal stub that supports the chainable API used in the server routes.
  const makeStub = () => {
    const stub: any = {};

    const chainable = () => stub;

    // Methods that return a Promise with a shape similar to supabase responses
    stub.select = async (..._args: any[]) => ({ data: [], error: null, count: 0 });
    stub.insert = async (..._args: any[]) => ({ data: null, error: null });
    stub.update = async (..._args: any[]) => ({ data: null, error: null });
    stub.delete = async (..._args: any[]) => ({ data: null, error: null });
    stub.eq = chainable;
    stub.or = chainable;
    stub.order = chainable;
    stub.single = async () => ({ data: null, error: null });
    stub.limit = chainable;
    stub.returns = chainable;

    return stub;
  };

  supabase = {
    from: (_table: string) => makeStub(),
    storage: {
      from: (_name: string) => ({ upload: async () => ({ data: null, error: null }) })
    }
  };
}

export { supabase };
