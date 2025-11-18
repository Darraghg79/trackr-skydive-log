#!/bin/bash

# Add 'export const dynamic = force-dynamic' to page files
files=(
  "src/app/(auth)/forgot-password/page.tsx"
  "src/app/(auth)/login/page.tsx"
  "src/app/(auth)/magic-link/page.tsx"
  "src/app/(auth)/register/page.tsx"
  "src/app/(auth)/reset-password/page.tsx"
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

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    if ! grep -q "export const dynamic" "$file"; then
      # Find last import line and add after it
      awk '/^import/ {last=NR} NR==last+1 && !/^import/ {print "\nexport const dynamic = '\''force-dynamic'\''"; printed=1} {print} END {if (!printed) print "\nexport const dynamic = '\''force-dynamic'\''"}' "$file" > "$file.tmp"
      mv "$file.tmp" "$file"
      echo "✓ Added to $file"
    else
      echo "- Skipped $file (already has dynamic export)"
    fi
  fi
done

echo "Done!"
