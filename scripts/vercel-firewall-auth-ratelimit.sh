#!/usr/bin/env bash
# Optional Vercel Firewall rate limits for auth endpoints (run after: vercel link)
# Docs: https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration
set -euo pipefail

echo "Publishing draft WAF rules for auth abuse protection..."
echo "(Requires Vercel Pro+ with WAF; adjust paths for your project.)"

vercel firewall rules add \
  --name "rate-limit-signup" \
  --action rate_limit \
  --rate-limit 10 \
  --rate-limit-window 60 \
  --condition 'req.path matches "^/api/auth/signup"' \
  || echo "Skip: signup rule failed (plan/CLI)"

vercel firewall rules add \
  --name "rate-limit-pre-login" \
  --action rate_limit \
  --rate-limit 30 \
  --rate-limit-window 60 \
  --condition 'req.path matches "^/api/auth/pre-login"' \
  || echo "Skip: pre-login rule failed"

vercel firewall rules add \
  --name "rate-limit-forgot-password" \
  --action rate_limit \
  --rate-limit 10 \
  --rate-limit-window 60 \
  --condition 'req.path matches "^/api/auth/forgot-password"' \
  || echo "Skip: forgot-password rule failed"

echo "Review with: vercel firewall overview"
echo "Publish with: vercel firewall publish"