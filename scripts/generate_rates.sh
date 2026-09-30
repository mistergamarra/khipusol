#!/bin/bash

# --- 0. RESOLVE PROJECT ROOT & ENV PATH ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$(basename "$SCRIPT_DIR")" == "scripts" ]]; then
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    ENV_FILE="$SCRIPT_DIR/.env" # Looks in scripts/ if run from scripts/
else
    PROJECT_ROOT="$SCRIPT_DIR"
    ENV_FILE="$PROJECT_ROOT/scripts/.env" # Looks in scripts/ if run from root
fi

OUTPUT_DIR="$PROJECT_ROOT/rates"

# --- 1. LOAD ENVIRONMENT VARIABLES FROM .env ---
if [ -f "$ENV_FILE" ]; then
    # Export variables from .env, ignoring comments and empty lines
    # shellcheck disable=SC2046
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "⚠️ Warning: .env file not found at $ENV_FILE"
fi

# Fallback mapping (supports both TOKEN/API_URL or SUNAT_API_TOKEN/EXCHANGE_API_URL)
TOKEN="${TOKEN:-$SUNAT_API_TOKEN}"
API_URL="${API_URL:-$EXCHANGE_API_URL}"

# --- 2. VALIDATION ---
if [ -z "$TOKEN" ]; then
    echo "❌ Error: Token is missing. Please make sure TOKEN or SUNAT_API_TOKEN is defined in your .env file."
    exit 1
fi

if [ -z "$API_URL" ]; then
    API_URL="https://e-consulta.sunat.gob.pe/cl-at-ittipcam/tcS01Alias/listarTipoCambio"
fi

# --- 3. CONFIGURATION & LOOP ---
START_YEAR=2018
END_YEAR=2026

# Get current system date components
CURRENT_YEAR=$(date +%Y)
CURRENT_MONTH=$(date +%m)
TODAY=$(date +%Y-%m-%d)

echo "🚀 Starting SUNAT historical rate generator with smart file-age caching..."

for year in $(seq $START_YEAR $END_YEAR); do
    # Loop from 0 (January) to 11 (December) to match SUNAT's 0-indexed months
    for mes_idx in $(seq 0 11); do

        # Calculate file month number (01 to 12) for naming
        file_month=$(printf "%02d" $((mes_idx + 1)))

        # --- GUARD: Skip future months completely ---
        if [ "$year" -gt "$CURRENT_YEAR" ] || { [ "$year" -eq "$CURRENT_YEAR" ] && [ "$file_month" -gt "$CURRENT_MONTH" ]; }; then
            continue
        fi

        TARGET_DIR="$OUTPUT_DIR/$year"
        TARGET_FILE="$TARGET_DIR/$file_month.json"

# --- SMART CHECK ---
        if [ -s "$TARGET_FILE" ]; then
            # If it IS the current active month/year, check if it was updated TODAY
            if [ "$year" -eq "$CURRENT_YEAR" ] && [ "$file_month" -eq "$CURRENT_MONTH" ]; then
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    FILE_DATE=$(stat -f "%Sm" -t "%Y-%m-%d" "$TARGET_FILE")
                else
                    FILE_DATE=$(stat -c "%y" "$TARGET_FILE" | cut -d' ' -f1)
                fi

                if [ "$FILE_DATE" = "$TODAY" ]; then
                    echo "⏭️  Skipping current month $file_month/$year (already updated today: $FILE_DATE)"
                    continue
                else
                    echo "🔄 Current month $file_month/$year file is from $FILE_DATE. Refreshing for new daily rates..."
                fi
            else
                # For any true past month/year, if the file exists, skip it!
                echo "⏭️  Skipping past file $file_month/$year (already cached)"
                continue
            fi
        fi

        # Create year directory if it doesn't exist
        mkdir -p "$TARGET_DIR"

        echo "🔍 Fetching rates for $file_month/$year (API mes: $mes_idx)..."

        # Make POST request using 0-indexed 'mes' and dynamic token
        response=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json;charset=UTF-8" \
            -H "Accept: application/json, text/plain, */*" \
            -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" \
            -d "{\"anio\":$year,\"mes\":$mes_idx,\"token\":\"$TOKEN\"}")

        # Validate response and save
        if [[ "$response" == "["* ]] && [[ "$response" != "[]" ]]; then
            echo "$response" > "$TARGET_FILE"
            echo "  ✅ Created & Saved: $TARGET_FILE"
        else
            echo "  ⚠️ Warning: No records or invalid response for month index $mes_idx / $year"
        fi

        # Polite delay to avoid hammering SUNAT's servers
        sleep 1
    done
done

echo "🎉 Rate generation and verification complete! Files are stored in '$OUTPUT_DIR/'."