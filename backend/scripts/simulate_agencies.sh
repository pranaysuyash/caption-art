#!/usr/bin/env bash
# Simulate 5 agencies through the workflow and summarize outcomes
# Usage: bash backend/scripts/simulate_agencies.sh
# Requires: curl, jq

set -euo pipefail

BASE="http://localhost:3001"
TMPDIR=$(mktemp -d)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AGENCIES=5

metrics_file="$TMPDIR/metrics.json"
printf '{"agencies":[]}' > "$metrics_file"

for i in $(seq 1 $AGENCIES); do
  echo "\n--- Agency $i ---"
  COOKIEJAR="$TMPDIR/session_$i.txt"

  # Signup (if already exists, fallback to login)
  USER_EMAIL="agency${i}@test.com"
  RESP=$(curl -s -c $COOKIEJAR -H "Content-Type: application/json" -X POST -d '{"email":"'$USER_EMAIL'","password":"password","agencyName":"Agency '$i'"}' "$BASE/api/auth/signup")
  AGENCY_ID=$(echo "$RESP" | jq -r '.agency.id // empty')
  if [[ -z "$AGENCY_ID" ]]; then
    # Try login if user already exists
    LOGIN_RESP=$(curl -s -c $COOKIEJAR -H "Content-Type: application/json" -X POST -d '{"email":"'$USER_EMAIL'","password":"password"}' "$BASE/api/auth/login")
    AGENCY_ID=$(echo "$LOGIN_RESP" | jq -r '.agency.id // empty')
  fi

  # Create Workspace
  RESP=$(curl -s -b $COOKIEJAR -H "Content-Type: application/json" -X POST -d '{"clientName":"Client_'$i'"}' "$BASE/api/workspaces")
  WORKSPACE_ID=$(echo "$RESP" | jq -r '.workspace.id // empty')
  if [[ -z "$WORKSPACE_ID" || "$WORKSPACE_ID" == "" ]]; then
    # Fetch list of workspaces and pick the latest for the agency (fallback)
    WORKSPACES_RESP=$(curl -s -b $COOKIEJAR "$BASE/api/workspaces" || true)
    WORKSPACE_ID=$(echo "$WORKSPACES_RESP" | jq -r '.workspaces[0].id // empty')
    echo "Fallback Workspace ID: $WORKSPACE_ID"
  fi

  # Create Brand Kit
  RESP=$(curl -s -b $COOKIEJAR -H "Content-Type: application/json" -X POST -d '{"workspaceId":"'$WORKSPACE_ID'","colors":{"primary":"#123456","secondary":"#654321","tertiary":"#ABCDEF"},"fonts":{"heading":"Inter","body":"Roboto"},"voicePrompt":"Friendly, helpful"}' "$BASE/api/brand-kits" )
  BRANDKIT_ID=$(echo "$RESP" | jq -r '.brandKit.id // empty')

  # Upload single asset
  # using the included test-image.png in repo if present
  UPLOAD_RESP=$(curl -s -b $COOKIEJAR -F "workspaceId=$WORKSPACE_ID" -F "files=@$REPO_ROOT/test-image.png" "$BASE/api/assets/upload")
  ASSET_IDS_JSON=$(echo "$UPLOAD_RESP" | jq -c '.assets | map(.id) // []')
  # Do batch generate call
  BATCH_START_RESP=$(curl -s -b $COOKIEJAR -H "Content-Type: application/json" -X POST -d "{\"workspaceId\":\"$WORKSPACE_ID\",\"assetIds\":$ASSET_IDS_JSON}" "$BASE/api/batch/generate")
  JOB_ID=$(echo "$BATCH_START_RESP" | jq -r '.jobId // empty')

  # Poll job status until completed or timeout
  STATUS=""
  if [[ -n "$JOB_ID" ]]; then
    for j in {1..15}; do
      sleep 1
      STATUS=$(curl -s -b $COOKIEJAR "$BASE/api/batch/jobs/$JOB_ID" | jq -r '.job.status // "unknown"')
      echo "Job $JOB_ID status: $STATUS"
      if [[ "$STATUS" == "completed" ]] || [[ "$STATUS" == "failed" ]]; then break; fi
    done
  else
    echo "Batch job not created for workspace $WORKSPACE_ID"
  fi

  # Get approval grid
  GRID_RESP=$(curl -s -b $COOKIEJAR "$BASE/api/approval/workspace/$WORKSPACE_ID/grid" || true)
  # Auto-approve any captions for the sake of export simulation
  CAPTION_IDS=$(echo "$GRID_RESP" | jq -c '[.grid[]?.caption?.id] | map(select(.!=null))' 2>/dev/null || echo '[]')
  if [[ "$CAPTION_IDS" != "[]" ]] && [[ "$CAPTION_IDS" != "null" ]]; then
    echo "Approving captions: $CAPTION_IDS"
    # Approve each caption
    echo "$CAPTION_IDS" | jq -r '.[]' | while read -r cid; do
      curl -s -b $COOKIEJAR -X PUT -H "Content-Type: application/json" "$BASE/api/approval/captions/$cid/approve" || true
    done
    # refresh grid
    GRID_RESP=$(curl -s -b $COOKIEJAR "$BASE/api/approval/workspace/$WORKSPACE_ID/grid" || true)
  fi
  # Attempt export start (some environments may have issues)
  EXPORT_RESP=$(curl -s -b $COOKIEJAR -X POST "$BASE/api/export/workspace/$WORKSPACE_ID/start" || true)
  EXPORT_JOB_ID=$(echo "$EXPORT_RESP" | jq -r '.jobId // empty')
  # Poll export job until completed/failed
  if [[ -n "$EXPORT_JOB_ID" && "$EXPORT_JOB_ID" != "" ]]; then
    EXP_STATUS=""
    for k in {1..30}; do
      sleep 1
      EXP_STATUS=$(curl -s -b $COOKIEJAR "$BASE/api/export/jobs/$EXPORT_JOB_ID" | jq -r '.job.status // "unknown"')
      echo "Export job $EXPORT_JOB_ID status: $EXP_STATUS"
      if [[ "$EXP_STATUS" == "completed" ]] || [[ "$EXP_STATUS" == "failed" ]]; then break; fi
    done
  fi

  # Collect metrics for agency
  grid_json=$(echo "$GRID_RESP" | jq -c '.' 2>/dev/null || echo 'null')
  export_json=$(echo "$EXPORT_RESP" | jq -c '.' 2>/dev/null || echo 'null')
  # assetIds is JSON array already
  J=$(jq -n --arg agencyId "$AGENCY_ID" --arg workspaceId "$WORKSPACE_ID" --arg brandKitId "$BRANDKIT_ID" --argjson assetIds "$ASSET_IDS_JSON" --arg jobId "$JOB_ID" --argjson grid "$grid_json" --argjson exportResp "$export_json" '{agencyId: $agencyId, workspaceId: $workspaceId, brandKitId: $brandKitId, assetIds: $assetIds, batchJob: $jobId, grid: $grid, exportResp: $exportResp}' )
  jq --argjson j "$J" '.agencies += [$j]' $metrics_file > $metrics_file.tmp && mv $metrics_file.tmp $metrics_file

  echo "Agency $i finished"

done

# Summarize metrics
cat $metrics_file | jq

# Cleanup
# rm -r $TMPDIR

exit 0
