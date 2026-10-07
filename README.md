# WebBLE OTA Interface

Modern Web Bluetooth interface for ESP32 firmware over-the-air (OTA) updates.

## ✨ Features

- 🌐 **GitHub Pages Ready** - Deploy on any static hosting
- 📁 **Firmware Selector** - Choose from server firmware or upload local files
- 🎨 **Modern UI** - Beautiful, responsive interface with dark mode support
- ⚡ **Fast/Slow Mode** - Balance speed vs. reliability
- 📊 **Progress Tracking** - Real-time progress bar and detailed logs
- 🔒 **Secure** - Works over HTTPS with Web Bluetooth API
- 📱 **Mobile Friendly** - Responsive design for all devices

## 🚀 Quick Start

### Local Development

```bash
# Start server
python -m http.server 8080

# Open browser
# http://localhost:8080
```

### GitHub Pages Deployment

See [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md) for detailed instructions.

**Quick deploy:**
1. Add firmware files to `firmware/` folder
2. Run `python generate_firmware_manifest.py`
3. Commit and push to GitHub
4. Enable GitHub Pages in repository settings

Your OTA interface will be live at: `https://yourusername.github.io/yourrepo/`

## 📁 File Structure

```
webble/
├── index.html                      # Main interface
├── style.css                       # Styling
├── firmware/                       # Firmware directory
│   ├── manifest.json              # Firmware list (auto-generated)
│   └── *.bin                      # Firmware files
├── generate_firmware_manifest.py   # Manifest generator
└── generate_firmware_manifest.bat  # Windows manifest generator
```

## 📖 Documentation

- [Firmware OTA Guide](FIRMWARE_OTA_GUIDE.md) - Complete usage guide
- [GitHub Pages Deployment](GITHUB_PAGES_DEPLOY.md) - Deployment tutorial

## 🛠️ Usage

### Adding Firmware

1. Copy firmware files to `firmware/` directory
2. Generate manifest:
   ```bash
   python generate_firmware_manifest.py
   ```
3. (Optional) Edit `firmware/manifest.json` to add versions and descriptions

### Connecting to Device

1. Open the interface in a Web Bluetooth compatible browser (Chrome, Edge, Opera)
2. Click "Connect to BLE Device"
3. Select your ESP32 device from the list

### Performing OTA Update

1. Go to OTA tab
2. Select firmware from dropdown OR upload local file
3. Configure transfer settings (chunk size, speed mode)
4. Click "Start OTA"
5. Monitor progress bar and logs
6. Device automatically reboots after successful update

## 🌐 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✅ Yes  | Recommended |
| Edge    | ✅ Yes  | Recommended |
| Opera   | ✅ Yes  | Full support |
| Firefox | ❌ No   | No Web Bluetooth support |
| Safari  | ❌ No   | Limited Web Bluetooth support |

**Requirements:**
- HTTPS connection (or localhost)
- Web Bluetooth API support
- Bluetooth adapter on device

## ⚙️ Configuration

### Transfer Settings

**Chunk Size:** 20-512 bytes (default: 180)
- Smaller chunks = more reliable, slower
- Larger chunks = faster, may timeout

**Speed Mode:**
- **Slow Mode** (default): 50ms pause, ~66 seconds for 1.4MB
- **Fast Mode**: 25ms pause, ~47 seconds for 1.4MB

### Manifest Format

`firmware/manifest.json`:
```json
[
  {
    "name": "firmware.bin",
    "path": "firmware/firmware.bin",
    "size": 1419952,
    "version": "1.31",
    "description": "Latest stable release"
  }
]
```

## 🐛 Troubleshooting

**Firmware list is empty:**
- Run `generate_firmware_manifest.py`
- Check `firmware/manifest.json` exists
- Verify firmware files are in `firmware/` folder

**Connection fails:**
- Ensure device is powered and BLE is enabled
- Check device is in range (< 10 meters)
- Try refreshing page and reconnecting

**OTA fails or times out:**
- Use Slow Mode instead of Fast Mode
- Reduce chunk size (try 120 bytes)
- Ensure stable BLE connection
- Check device has enough free flash space

**Browser can't find device:**
- Use Chrome, Edge, or Opera
- Ensure HTTPS or localhost
- Enable Bluetooth on your computer
- Check device BLE advertising is working

## 🔐 Security

- Firmware files are publicly accessible on GitHub Pages
- No authentication (suitable for open-source projects)
- For private projects, consider:
  - Private repository (requires GitHub Pro)
  - External authenticated hosting for firmware
  - Local-only deployment

## 📄 License

Part of the TSF LoRaWAN ULP Gateway project.

## 🤝 Contributing

Firmware contributions, UI improvements, and bug reports welcome!
