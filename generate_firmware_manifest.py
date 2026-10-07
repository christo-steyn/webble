#!/usr/bin/env python3
"""
Generate firmware manifest.json from files in firmware/ directory
Run this script whenever you add/remove firmware files
"""
import json
import os
from pathlib import Path

def generate_manifest():
    """Generate manifest.json from firmware directory"""
    firmware_dir = Path('firmware')
    
    if not firmware_dir.exists():
        print("Warning: firmware/ directory does not exist")
        firmware_dir.mkdir()
        print("Created firmware/ directory")
    
    # Get all .bin files
    firmware_files = []
    for file in sorted(firmware_dir.glob('*.bin')):
        stat = file.stat()
        firmware_files.append({
            'name': file.name,
            'path': f'firmware/{file.name}',
            'size': stat.st_size,
            'version': 'unknown',  # You can edit this manually in the JSON
            'description': ''       # You can edit this manually in the JSON
        })
    
    # Write manifest
    manifest_path = firmware_dir / 'manifest.json'
    with open(manifest_path, 'w') as f:
        json.dump(firmware_files, f, indent=2)
    
    print(f"Generated {manifest_path}")
    print(f"Found {len(firmware_files)} firmware file(s):")
    for fw in firmware_files:
        size_mb = fw['size'] / 1024 / 1024
        print(f"  - {fw['name']} ({size_mb:.2f} MB)")
    
    if firmware_files:
        print("\nTip: Edit manifest.json to add version and description for each firmware")
    else:
        print("\nNo .bin files found in firmware/ directory")

if __name__ == '__main__':
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    generate_manifest()
