#!/usr/bin/env python3
"""
Generate firmware manifest.json from files in the firmware/ directory
Run this script whenever you add/remove firmware files
"""
import json
import os
from pathlib import Path

def generate_manifest():
    """Generate manifest.json from the firmware directory."""
    firmware_dir = Path('firmware')
    
    if not firmware_dir.exists():
        print("Warning: firmware/ directory does not exist")
        firmware_dir.mkdir()
        print("Created firmware/ directory")

    manifest_path = firmware_dir / 'manifest.json'
    if manifest_path.exists():
        with open(manifest_path, 'r') as f:
            existing_manifest = json.load(f)
    else:
        existing_manifest = []
    existing_by_path = {
        entry.get('path'): entry
        for entry in existing_manifest
        if isinstance(entry, dict) and entry.get('path')
    }
    
    firmware_files = []
    for file in sorted(firmware_dir.glob('*.bin')):
        stat = file.stat()
        path = f'{firmware_dir.as_posix()}/{file.name}'
        previous = existing_by_path.get(path, {})
        firmware_files.append({
            'name': file.name,
            'path': path,
            'size': stat.st_size,
            'version': previous.get('version', 'unknown'),
            'description': previous.get('description', '')
        })
    
    # Write manifest
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
