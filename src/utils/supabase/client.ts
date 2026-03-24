/**
 * client.ts
 * 
 * This file contains the client-side logic for creating a Supabase client instance that can be used in Next.js applications. It utilizes the `createClient` function from the `@supabase/supabase-js` package to create a client that can handle client-side interactions with the Supabase backend. The client is configured with the Supabase URL and key, which are retrieved from environment variables. The `createClient` function does not require any additional configuration for cookies, as it is designed to work seamlessly in client-side environments.
 * 
 * @module utils/supabase/client
 */
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = () =>
    createBrowserClient(
        supabaseUrl!,
        supabaseKey!,
    );