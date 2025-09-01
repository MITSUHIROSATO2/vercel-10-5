#!/bin/bash

# Convert FBX to GLB using Blender
echo "Converting Man Grey Suit avatar from FBX to GLB format..."

# Check if Blender is installed
if ! command -v blender &> /dev/null; then
    echo "Error: Blender is not installed or not in PATH"
    echo "Please install Blender from https://www.blender.org/download/"
    exit 1
fi

# Run the conversion script
blender --background --python ../blender/convert_fbx_to_glb.py

echo "Conversion process completed!"