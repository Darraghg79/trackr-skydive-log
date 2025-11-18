#!/bin/bash

# Remove dynamic export from client components (files with "use client")
# Keep it only for server components (auth pages)

client_files=(
  "src/app/(dashboard)/aircraft/page.tsx"
  "src/app/(dashboard)/aircraft/new/page.tsx"
  "src/app/(dashboard)/dropzones/page.tsx"
  "src/app/(dashboard)/dropzones/new/page.tsx"
  "src/app/(dashboard)/gear/page.tsx"
  "src/app/(dashboard)/gear/new/page.tsx"
  "src/app/(dashboard)/invoices/page.tsx"
  "src/app/(dashboard)/invoices/new/page.tsx"
  "src/app/(dashboard)/jump-types/page.tsx"
  "src/app/(dashboard)/jump-types/new/page.tsx"
  "src/app/(dashboard)/jumps/page.tsx"
  "src/app/(dashboard)/jumps/new/page.tsx"
  "src/app/(dashboard)/rigs/page.tsx"
  "src/app/(dashboard)/rigs/new/page.tsx"
  "src/app/(dashboard)/settings/account/page.tsx"
  "src/app/(dashboard)/settings/notifications/page.tsx"
  "src/app/(dashboard)/settings/profile/page.tsx"
  "src/app/(dashboard)/settings/security/page.tsx"
)

for file in "${client_files[@]}"; do
  if [ -f "$file" ]; then
    # Remove all instances of dynamic export
    sed -i '' '/^export const dynamic.*force-dynamic/d' "$file"
    # Remove empty lines at start
    sed -i '' '1{/^$/d;}' "$file"
    echo "✓ Cleaned $file"
  fi
done

# Auth pages need it at top (before imports)
auth_files=(
  "src/app/(auth)/forgot-password/page.tsx"
  "src/app/(auth)/login/page.tsx"
  "src/app/(auth)/magic-link/page.tsx"
  "src/app/(auth)/register/page.tsx"
  "src/app/(auth)/reset-password/page.tsx"
)

for file in "${auth_files[@]}"; do
  if [ -f "$file" ]; then
    # Remove existing dynamic exports first
    sed -i '' '/^export const dynamic.*force-dynamic/d' "$file"
    # Add at very top
    echo -e "export const dynamic = 'force-dynamic'\n$(cat $file)" > "$file"
    echo "✓ Fixed $file"
  fi
done

echo "Done!"
