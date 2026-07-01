#!/usr/bin/env bash
# Stage Vercel Firewall rate limits for auth endpoints (log-only; enforce after review).
#
# Prerequisites:
#   vercel login
#   vercel link    # select the oigausted project
#
# Requires Vercel Pro+ with WAF. Rules are staged as drafts — not live until you publish.
#
# Staged rollout:
#   1. Run this script (rules default to --rate-limit-action log).
#   2. vercel firewall diff && vercel firewall overview
#   3. Review traffic: https://vercel.com/<team>/oigausted/firewall/traffic?filter=<ruleId>
#   4. Tighten: vercel firewall rules edit "<name>" --rate-limit-action rate_limit --yes
#   5. vercel firewall publish --yes
#
# Docs: https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration
set -euo pipefail

VERCEL="${VERCEL:-npx vercel}"
RATE_LIMIT_ACTION="${RATE_LIMIT_ACTION:-log}"

add_rule() {
  local name="$1"
  local path_prefix="$2"
  local requests="$3"
  local window="${4:-60}"

  $VERCEL firewall rules add "$name" \
    --condition "{\"type\":\"path\",\"op\":\"pre\",\"value\":\"$path_prefix\"}" \
    --condition '{"type":"method","op":"eq","value":"POST"}' \
    --action rate_limit \
    --rate-limit-window "$window" \
    --rate-limit-requests "$requests" \
    --rate-limit-keys ip \
    --rate-limit-action "$RATE_LIMIT_ACTION" \
    --yes
}

echo "Staging WAF auth rate-limit rules (action: $RATE_LIMIT_ACTION)..."
echo "(Requires Vercel Pro+ with WAF. Skips deprecated /api/auth/login.)"
echo

add_rule "Rate limit signup" "/api/auth/signup" 10 \
  || echo "Skip: signup rule failed (plan/CLI/auth)"

add_rule "Rate limit pre-login" "/api/auth/pre-login" 30 \
  || echo "Skip: pre-login rule failed (plan/CLI/auth)"

add_rule "Rate limit forgot-password" "/api/auth/forgot-password" 10 \
  || echo "Skip: forgot-password rule failed (plan/CLI/auth)"

add_rule "Rate limit reset-password" "/api/auth/reset-password" 10 \
  || echo "Skip: reset-password rule failed (plan/CLI/auth)"

echo
echo "Review staged changes:"
$VERCEL firewall diff || true
$VERCEL firewall overview || true
echo
echo "After reviewing dashboard traffic, publish with: vercel firewall publish --yes"