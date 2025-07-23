#!/bin/bash

while true; do
  fswatch -1 .  # Wait for a file change
  git add .
  git commit -m "Auto-update on change"
  git push origin main
done
