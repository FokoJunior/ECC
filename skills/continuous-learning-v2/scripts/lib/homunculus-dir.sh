#!/usr/bin/env bash
# Shared continuous-learning-v2 data-directory resolver.
#
# Resolution precedence:
#   1. CLV2_HOMUNCULUS_DIR, when absolute
#   2. XDG_DATA_HOME/junior-dev-homunculus, when XDG_DATA_HOME is absolute
#   3. HOME/.local/share/junior-dev-homunculus

_clv2_resolve_homunculus_dir() {
  if [ -n "${CLV2_HOMUNCULUS_DIR:-}" ]; then
    case "$CLV2_HOMUNCULUS_DIR" in
      /*) printf '%s\n' "$CLV2_HOMUNCULUS_DIR"; return 0 ;;
      *) printf '[junior-dev] CLV2_HOMUNCULUS_DIR=%s is not absolute; ignoring\n' "$CLV2_HOMUNCULUS_DIR" >&2 ;;
    esac
  fi

  if [ -n "${XDG_DATA_HOME:-}" ]; then
    case "$XDG_DATA_HOME" in
      /*) printf '%s/junior-dev-homunculus\n' "$XDG_DATA_HOME"; return 0 ;;
      *) printf '[junior-dev] XDG_DATA_HOME=%s is not absolute; ignoring\n' "$XDG_DATA_HOME" >&2 ;;
    esac
  fi

  case "${HOME:-}" in
    /*) printf '%s/.local/share/junior-dev-homunculus\n' "$HOME" ;;
    *)
      printf '[junior-dev] HOME=%s is not absolute; cannot resolve homunculus dir\n' "${HOME:-}" >&2
      return 1
      ;;
  esac
}
