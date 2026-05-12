#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CRATE_LEXICONS="../crate/lexicons"

if [[ ! -d "$CRATE_LEXICONS/social/crate" ]]; then
  echo "ERROR: Lexicons not found at $CRATE_LEXICONS/social/crate" >&2
  echo "" >&2
  echo "This script expects the crate repo to be cloned as a sibling directory:" >&2
  echo "  ../crate/lexicons/social/crate/" >&2
  echo "" >&2
  echo "Clone it with:" >&2
  echo "  git clone https://github.com/brittanyellich/crate.git ../crate" >&2
  exit 1
fi

LEXICONS_DIR="$(cd "$CRATE_LEXICONS" && pwd)"
LEXICON_FILES=()
while IFS= read -r -d '' f; do
  LEXICON_FILES+=("$f")
done < <(find "$LEXICONS_DIR/social" "$LEXICONS_DIR/community" -name "*.json" -print0 2>/dev/null | sort -z)

if [[ ${#LEXICON_FILES[@]} -eq 0 ]]; then
  echo "ERROR: No lexicon JSON files found under $LEXICONS_DIR" >&2
  exit 1
fi

OUTPUT_DIR="$REPO_ROOT/src/lexicon"
mkdir -p "$OUTPUT_DIR"

echo "==> crate-web lexicon codegen"
echo "    source: $LEXICONS_DIR/ (${#LEXICON_FILES[@]} files)"
echo "    output: src/lexicon/"
echo ""

cd "$LEXICONS_DIR"
yes | npx @atproto/lex-cli gen-api "$OUTPUT_DIR" "${LEXICON_FILES[@]}"

echo ""
echo "✓ Lexicon codegen complete. Remember to commit the generated files."
