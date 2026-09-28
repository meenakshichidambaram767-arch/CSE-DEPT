const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.log(`Supabase configuration incomplete: ${missing.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log('Supabase public configuration is present.');
}
