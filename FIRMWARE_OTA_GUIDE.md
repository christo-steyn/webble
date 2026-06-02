# WebBLE Firmware OTA System

## Overview

The WebBLE interface supports two methods for selecting firmware for OTA updates:
1. **Server Firmware**: Choose from firmware files listed in `firmware/manifest.json`
2. **Local File**: Upload a firmware file from your computer

**Works on GitHub Pages!** This system uses a static manifest file, so it works on any static hosting including GitHub Pages, Netlify, Vercel, etc.

## Usage

### Starting the Server (Local Development)

For local testing, use any static HTTP server:

```bash
# Windows - Simple HTTP server
startwebserver.bat

# Or use the Python server (with optional API)
start_server_with_api.bat

# Linux/Mac
python3 -m http.server 8080
```

The server will start at `http://localhost:8080`

### Adding Firmware Files

1. Place your `.bin` firmware files in the `webble/firmware/` folder
2. Run the manifest generator:
   ```bash
   # Windows
   generate_firmware_manifest.bat
   
   # Linux/Mac
   python3 generate_firmware_manifest.py
   ```
3. (Optional) Edit `firmware/manifest.json` to add version numbers and descriptions
4. Click the refresh button (🔄) in the OTA tab to reload the firmware list

**Example structure:**
```
webble/
  ├── firmware/
  │   ├── tsflorawanv1.bin
  │   ├── tsflorawanv1-v1.2.0.bin
  │   └── tsflorawanv1-debug.bin
  ├── server.py
  └── start_server_with_api.bat
```

### OTA Update Process

1. **Connect to Device**: Click "Connect to BLE Device" and select your ESP32
2. **Switch to OTA Tab**: Navigate to the OTA tab
3. **Select Firmware**:
   - **Option A**: Choose from the "Server Firmware" dropdown
   - **Option B**: Click "Local File" and browse for a `.bin` file
4. **Configure Transfer**:
   - Chunk Size: 180 bytes (default, recommended)
   - Fast Mode: Unchecked for reliability (check for faster transfer)
5. **Start OTA**: Click "Start OTA" button
6. **Monitor Progress**: Watch the progress bar and log messages
7. **Device Reboots**: Device automatically reboots after successful update

## Features

### Firmware Selection
- **Server Dropdown**: Lists all `.bin` files from `firmware/` folder
- **File Size Display**: Shows firmware size in MB
- **Refresh Button**: Reload firmware list without page refresh
- **Local Upload**: Alternative option for firmware not on server

### Transfer Settings
- **Chunk Size**: Configure data packet size (20-512 bytes)
- **Fast/Slow Mode**: Toggle between speed and stability
  - Slow Mode: More reliable, ~66 seconds for 1.4MB
  - Fast Mode: Faster transfer, ~47 seconds for 1.4MB, may timeout on some devices

### Progress Monitoring
- **Real-time Progress Bar**: Visual feedback of transfer progress
- **Transfer Counter**: Shows bytes transferred / total bytes
- **Status Display**: Current OTA state (Idle, Starting, In Progress, Completed, Error)
- **Detailed Log**: Message log with timestamps and events

## API Endpoints

### Static Manifest (firmware/manifest.json)

The system uses a static JSON file instead of a dynamic API, making it compatible with GitHub Pages and other static hosting services.

**Location:** `firmware/manifest.json`

**Format:**
```json
[
  {
    "name": "tsflorawanv1.bin",
    "path": "firmware/tsflorawanv1.bin",
    "size": 1419952,
    "version": "1.31",
    "description": "Latest stable release"
  }
]
```

**Fields:**
- `name`: Firmware filename (required)
- `path`: Relative path to firmware file (required)
- `size`: File size in bytes (required)
- `version`: Version string (optional, displayed in dropdown)
- `description`: Short description (optional, displayed in dropdown)
Run `generate_firmware_manifest.bat` to create/update manifest
- Click the refresh button (🔄) to reload the list
- Check `firmware/manifest.json` exists and is valid JSON
- Check browser console for
```bash
python3 generate_firmware_manifest.py
```

This script scans the `firmware/` directory and creates/updates `manifest.json` with all `.bin` files.

## GitHub Pages Deployment

To deploy on GitHub Pages:

1. **Prepare firmware files:**
   ```bash
   cd webble
   # Copy your firmware files to firmware/
   cp ../build/tsflorawanv1.bin firmware/
   
   # Generate manifest
   python3 generate_firmware_manifest.py
   
   # Edit manifest.json to add versions and descriptions
   ```

2. **Commit to repository:**
   ```bash
   git add firmware/manifest.json firmware/*.bin
   git commit -m "Update firmware files"
   git push
   ```

3. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Set source to main branch, `/webble` folder
   - Save and wait for deployment

4. **Access your page:**
   - URL: `https://yourusername.github.io/yourrepo/`
   - The firmware dropdown will work automatically!

### Advantages of Static Manifest
- ✅ Works on GitHub Pages (no server-side code needed)
- ✅ Works on any static hosting (Netlify, Vercel, Cloudflare Pages, etc.)
- ✅ Fast - no dynamic API calls
- ✅ Version control - manifest is tracked in git
- ✅ Cacheable - browsers can cache the manifest
- ✅ Offline-capable - can be used in PWAs

## Troubleshooting

### Firmware list is empty
- Ensure `.bin` files exist in `webble/firmware/` folder
- Click the refresh button (🔄) to reload the list
- Check browser console for API errors

### OTA fails or times out
- Try Slow Mode instead of Fast Mode
- Ensure stable BLE connection
- Check firmware file is valid ESP32 binary
- Verify device has enough free flash space

### Server won't start
- Any static HTTP server works: `python -m http.server 8080`
- For GitHub Pages, no server needed!
- Check port 8080 is not already in use
- Try the fallback: `python -m http.server 8080` (no firmware API)

### CRC32 mismatch
- Ensure firmware file is not corrupted
- Re-download or rebuild the firmware
- Check file was transferred completely

## Technical Details

### Two-Tier Pause Strategy
The OTA implementation uses smart pausing to maintain BLE connection stability:
- **Major Pause**: 1.5 seconds every 256KB (flash write catch-up)
- **Minor Pause**: 25ms (fast) or 50ms (slow) every 10 chunks (BLE keepalive)

### Connection Parameters
- Chunk size: 180 bytes (optimized for ESP32-S3 BLE stack)
- Supervision timeout: 6-9.6 seconds
- Connection interval: 7.5-15ms during OTA

### Compatibility
- Works with old firmware (no device-side changes required)
- Web Bluetooth API compatible browsers: Chrome, Edge, Opera
- Tested on ESP32-S3, should work on ESP32, ESP32-C3, ESP32-C6

## File Structure

```
webble/    # Place firmware .bin files here
│   ├── manifest.json          # Firmware list (generate with script)
│   ├── tsflorawanv1.bin
│   └── ...
├── index.html                 # Main WebBLE interface
├── style.css                  # Styling including OTA enhancements
├── generate_firmware_manifest.py    # Manifest generator script
├── generate_firmware_manifest.bat   # Windows manifest generator
├── server.py                  # Optional: Enhanced HTTP server
├── start_server_with_api.bat  # Optional: Windows server launcher
├── startwebserver.bat         # Simple HTTP server
└── ota/    twebserver.bat     # Simple HTTP server (no API)
└── ota/                   # Standalone OTA page
    ├── index.html
    ├── ota.js
    └── style.css
``Firmware manifest is public (fine for open-source projects)
- For production/private use, implement authentication
- On GitHub Pages, firmware files are publicly accessible
- Keep firmware files secure and verify integrity before deployment
- Consider using Git LFS for large firmware files on GitHub

- Server runs on localhost by default (not exposed to network)
- No authentication on firmware API (local development only)
- For production use, implement proper authentication and HTTPS
- Keep firmware files secure and verify integrity before deployment
