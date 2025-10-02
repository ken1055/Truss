/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@supabase/supabase-js"],
  // env: {
  //   NEXT_PUBLIC_SUPABASE_URL:
  //     process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
  //   NEXT_PUBLIC_SUPABASE_ANON_KEY:
  //     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy_key",
  // },
};

module.exports = nextConfig;
