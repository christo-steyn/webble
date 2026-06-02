# Quick Start: GitHub Pages Deployment

This guide shows how to deploy the WebBLE OTA interface on GitHub Pages.

## Prerequisites
- GitHub account
- Git installed locally
- Python 3 (for generating manifest)

## Step-by-Step Deployment

### 1. Prepare Your Firmware Files

```bash
# Navigate to webble directory
cd webble

# Copy your compiled firmware
cp ../build/tsflorawanv1.bin firmware/

# Generate the manifest
python generate_firmware_manifest.py
```

**Output:**
```
Generated firmware/manifest.json
Found 2 firmware file(s):
  - tsflorawanv1.bin (1.35 MB)
  - tsflorawanv1-87c4ce1-dirty.bin (1.35 MB)
```

### 2. Edit Manifest (Optional)

Edit `firmware/manifest.json` to add versions and descriptions:

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

### 3. Commit and Push

```bash
# Add files
git add firmware/manifest.json firmware/*.bin index.html style.css

# Commit
git commit -m "Deploy WebBLE OTA interface with firmware"

# Push to GitHub
git push origin main
```

### 4. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/webble` (if webble is in a subdirectory)
4. Click **Save**
5. Wait 1-2 minutes for deployment

### 5. Access Your Site

Your site will be available at:
```
https://<username>.github.io/<repository>/
```

For example:
```
https://johndoe.github.io/tsf_lorawan_ulp/
```

### 6. Test the OTA Interface

1. Open the deployed URL in Chrome, Edge, or Opera (Web Bluetooth supported)
2. Click "Connect to BLE Device"
3. Select your ESP32 device
4. Go to OTA tab
5. Select firmware from the dropdown (populated from manifest.json)
6. Click "Start OTA"

## Updating Firmware

When you have new firmware to deploy:

```bash
# 1. Copy new firmware
cp ../build/tsflorawanv1.bin firmware/tsflorawanv1-v1.32.bin

# 2. Regenerate manifest
python generate_firmware_manifest.py

# 3. Edit manifest to add version info
# Edit firmware/manifest.json

# 4. Commit and push
git add firmware/
git commit -m "Add firmware v1.32"
git push
```

GitHub Pages will automatically redeploy (takes 1-2 minutes).

## Large Firmware Files

If your firmware files are large (>50MB total), consider:

1. **Git LFS (Large File Storage):**
   ```bash
   git lfs install
   git lfs track "*.bin"
   git add .gitattributes
   ```

2. **External Hosting:**
   - Host firmware on a CDN or cloud storage
   - Update manifest.json paths to absolute URLs:
   ```json
   {
     "name": "tsflorawanv1.bin",
     "path": "https://cdn.example.com/firmware/tsflorawanv1.bin",
     ...
   }
   ```

3. **Selective Deployment:**
   - Only deploy latest firmware to GitHub
   - Keep archives elsewhere

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to webble/:
   ```bash
   echo "ota.yourdomain.com" > CNAME
   ```

2. Configure DNS:
   - Add CNAME record: `ota.yourdomain.com` → `<username>.github.io`

3. Enable HTTPS in GitHub Pages settings

## Troubleshooting

**Firmware dropdown is empty:**
- Check `firmware/manifest.json` exists
- Verify JSON is valid (use JSONLint)
- Check browser console for 404 errors
- Ensure firmware files are committed and pushed

**Page shows 404:**
- Verify GitHub Pages is enabled
- Check the correct folder is selected (root or /webble)
- Wait a few minutes for deployment
- Check GitHub Actions tab for deployment status

**Firmware won't download:**
- Check file paths in manifest.json are relative
- Ensure firmware files are in the firmware/ folder
- Check browser console for CORS errors
- Verify files are accessible at `https://your-site/firmware/file.bin`

**Web Bluetooth doesn't work:**
- Use Chrome, Edge, or Opera (Firefox doesn't support Web Bluetooth)
- Use HTTPS (GitHub Pages provides this automatically)
- Web Bluetooth requires secure context (localhost or HTTPS)

## Best Practices

1. **Version Control:** Keep manifest.json in git
2. **Semantic Versioning:** Use clear version numbers
3. **Release Notes:** Add descriptions to manifest entries
4. **Testing:** Test locally before pushing to GitHub
5. **Backups:** Keep firmware backups outside the repository
6. **Security:** Don't commit debug/development builds to public repos
7. **File Size:** Compress firmware if possible, monitor repo size

## Example Workflow

```bash
# 1. Build firmware
cd ../
idf.py build

# 2. Copy to webble
cp build/tsflorawanv1.bin webble/firmware/tsflorawanv1-v1.32.bin

# 3. Generate manifest
cd webble
python generate_firmware_manifest.py

# 4. Edit manifest
code firmware/manifest.json  # Add version and description

# 5. Test locally
python -m http.server 8080
# Open http://localhost:8080 and test

# 6. Deploy
git add firmware/
git commit -m "Release firmware v1.32"
git push

# 7. Verify deployment
# Open https://yourusername.github.io/yourrepo/
# Wait 1-2 minutes, then test
```

## Summary

✅ **Static hosting compatible** - No server-side code needed  
✅ **Free hosting** - GitHub Pages is free for public repos  
✅ **Automatic deployment** - Push to deploy  
✅ **HTTPS included** - Secure by default  
✅ **Custom domains** - Use your own domain  
✅ **Version control** - Full git history  

Your WebBLE OTA interface is now live and accessible from anywhere!
