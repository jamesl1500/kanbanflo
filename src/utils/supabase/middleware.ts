/**
 * middleware.ts
 * 
 * This file contains the middleware logic for handling authentication and session management in a Next.js application using Supabase. The middleware is designed to intercept requests and manage user sessions by refreshing them as needed. It utilizes the `createMiddlewareClient` function from the `@supabase/ssr` package to create a middleware client that can handle authentication and session management effectively. The middleware is configured with the Supabase URL and key, which are retrieved from environment variables. The `createMiddlewareClient` function takes a cookie store as an argument, allowing it to manage cookies effectively during SSR.
 * 
 * @module utils/supabase/middleware
 */
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  return supabaseResponse
};