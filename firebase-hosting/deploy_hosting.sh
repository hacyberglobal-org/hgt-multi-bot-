#!/bin/bash
# HACYBERGLOBATECH - Firebase Hosting to Cloud Run Gateway Deployment

echo "⚡ Deploying Firebase Hosting Rewrites to Cloud Run (Service: ais-pre-dlxtcm22exfd5ssxaa6siv, Region: us-east5)..."

PROJECT_ID=${1:-"flutter-ai-playground-cb2b3"}

echo "🎯 Target Firebase Project: $PROJECT_ID"
firebase deploy --only hosting --project "$PROJECT_ID"
