#!/bin/bash

# --- 1. LOAD ENVIRONMENT VARIABLES FROM .env ---
if [ -f .env ]; then
    # Export variables from .env, ignoring comments and empty lines
    # shellcheck disable=SC2046
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️ Warning: .env file not found in the root directory."
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
OUTPUT_DIR="rates"
START_YEAR=2020
END_YEAR=2026

echo "🚀 Starting SUNAT historical rate generator with smart caching..."

for year in $(seq $START_YEAR $END_YEAR); do
    # Loop from 0 (January) to 11 (December) to match SUNAT's 0-indexed months
    for mes_idx in $(seq 0 11); do

        # Calculate file month number (01 to 12) for naming
        file_month=$(printf "%02d" $((mes_idx + 1)))

        TARGET_DIR="$OUTPUT_DIR/$year"
        TARGET_FILE="$TARGET_DIR/$file_month.json"

        # --- SMART CHECK: Skip if file already exists and has content ---
        if [ -s "$TARGET_FILE" ]; then
            echo "⏭️  Skipping $file_month/$year (already exists: $TARGET_FILE)"
            continue
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