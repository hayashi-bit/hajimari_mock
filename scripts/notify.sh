#!/bin/bash
REPO="/home/user/hajimari_mock"
ORIGIN=$(git -C "$REPO" remote get-url origin)
TMPDIR=$(mktemp -d)

git init "$TMPDIR" -b notify >/dev/null 2>&1
git -C "$TMPDIR" remote add origin "$ORIGIN"

printf '{"ts":%d}' "$(date +%s)" > "$TMPDIR/notify.json"

mkdir -p "$TMPDIR/.github/workflows"
cat > "$TMPDIR/.github/workflows/notify-supabase.yml" << 'EOF'
name: Notify Supabase on completion

on:
  push:
    branches:
      - notify

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Update Supabase timestamp
        run: |
          curl -sf -X PATCH \
            "https://kwmulkworqsswmiqbabd.supabase.co/rest/v1/mascot_notify?id=eq.1" \
            -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bXVsa3dvcnFzc3dtaXFiYWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDQwMzcsImV4cCI6MjA5MjcyMDAzN30.yT9dssLbf6gjIzisahhRy8CJpzjxyQxpXdg_tI63imE" \
            -H "Content-Type: application/json" \
            -d '{"done":true}'
EOF

git -C "$TMPDIR" add notify.json .github/workflows/notify-supabase.yml
git -C "$TMPDIR" -c user.email="noreply@anthropic.com" -c user.name="Claude" commit -m "notify" >/dev/null 2>&1
git -C "$TMPDIR" push origin notify --force >/dev/null 2>&1
rm -rf "$TMPDIR"
