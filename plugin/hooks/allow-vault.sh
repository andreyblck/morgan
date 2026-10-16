#!/usr/bin/env bash
#
# Auto-allow the morgan vault MCP tools so they never interrupt a session with a permission
# prompt. Reads at /scope, /pull, /track and /break, and the autonomous write at /track close-out
# and the /camp seal, are part of the method — a prompt there stalls the run or, worse, loses the
# finding when nobody is at the keyboard.
#
# This is safe to auto-allow because the server is the real gate: a write takes only a known
# shape, Confirmed only, no duplicate, no secret, no personal name, and it is a no-op when no
# vault is configured. The notes it writes are data, not instructions, and a wrong one is
# reversible (supersede/delete). A deny or ask rule in the user's own settings still overrides
# this hook (deny > ask > allow), so a team that wants to review writes can say so.
#
# Scoped twice: the matcher in hooks.json fires this only for mcp__plugin_morgan_vault__*, and
# the guard below allows only when the tool name is actually in that family. Anything else gets
# no decision, so the normal permission flow is untouched.

input="$(cat)"
case "$input" in
  *'"tool_name":"mcp__plugin_morgan_vault__'* | *'"tool_name": "mcp__plugin_morgan_vault__'*)
    printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"morgan vault tool (server-gated)"}}'
    ;;
esac
exit 0
