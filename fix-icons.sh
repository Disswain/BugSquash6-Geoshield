#!/bin/bash
# fix-icons.sh
# Run this from your project root: bash fix-icons.sh

TARGET_DIR="frontend/src/components"

echo "🔍 Fixing react-icons imports in $TARGET_DIR ..."

# Replace old FA5 -> FA6 names
find "$TARGET_DIR" -type f -name "*.js" -o -name "*.jsx" | while read file; do
  echo "Updating $file ..."

  # ControlPanel.js
  sed -i 's/FaPlayCircle/FaCirclePlay/g' "$file"
  sed -i 's/FaRedo/FaRotateRight/g' "$file"
  sed -i 's/FaBroadcastTower/FaTowerBroadcast/g' "$file"

  # AlertsPanel.js
  sed -i 's/FaExclamationTriangle/FaTriangleExclamation/g' "$file"
  sed -i 's/FaShieldAlt/FaShield/g' "$file"
done

echo "✅ All icons updated to react-icons/fa6"
