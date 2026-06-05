#!/bin/bash
TMPDIR=$(mktemp -d)
ORIGIN=$(git -C /home/user/hajimari_mock remote get-url origin)
git init "$TMPDIR" -b notify >/dev/null 2>&1
cd "$TMPDIR"
git remote add origin "$ORIGIN"
printf '{"ts":%d}' "$(date +%s)" > notify.json
git add notify.json
git -c user.email="noreply@anthropic.com" -c user.name="Claude" commit -m "notify" >/dev/null 2>&1
git push origin notify --force >/dev/null 2>&1
rm -rf "$TMPDIR"
