#!/bin/bash
REPO="/home/user/hajimari_mock"
ORIGIN=$(git -C "$REPO" remote get-url origin)
TMPDIR=$(mktemp -d)

git init "$TMPDIR" -b notify >/dev/null 2>&1
git -C "$TMPDIR" remote add origin "$ORIGIN"
printf '{"ts":%d}' "$(date +%s)" > "$TMPDIR/notify.json"
git -C "$TMPDIR" add notify.json
git -C "$TMPDIR" -c user.email="noreply@anthropic.com" -c user.name="Claude" commit -m "notify" >/dev/null 2>&1
git -C "$TMPDIR" push origin notify --force >/dev/null 2>&1
rm -rf "$TMPDIR"
