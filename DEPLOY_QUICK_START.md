# Quick Deployment Guide

## Easy Deployment (Recommended)

Just double-click or run:
```batch
deploy-to-github.bat
```

Or with PowerShell:
```powershell
.\deploy-to-github.ps1
```

This will:
1. Initialize git in the webble folder (first time only)
2. Set remote to https://github.com/christo-steyn/webble.git
3. Generate firmware manifest
4. Commit and push all changes

Your site will be at: **https://christo-steyn.github.io/webble/**

---

## First Time Setup

### Enable GitHub Pages (do this once):
1. Go to https://github.com/christo-steyn/webble
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**

That's it! Future deployments just need to run the script.

---

## Manual Deployment

If you prefer manual control:

```bash
cd webble

# First time only:
git init
git branch -M main
git remote add origin https://github.com/christo-steyn/webble.git

# Every deployment:
python generate_firmware_manifest.py  # If you have firmware
git add -A
git commit -m "Your commit message"
git push -u origin main
```

---

## Updating Only Firmware

```bash
# 1. Copy new firmware to firmware/ folder
cp ../build/tsflorawanv1.bin firmware/

# 2. Deploy
deploy-to-github.bat
```

The manifest will be automatically regenerated.

---

## Tips

- **Firmware too large?** GitHub has a 100MB file limit. Use Git LFS for large files.
- **Private firmware?** Consider using a private repository or hosting firmware elsewhere.
- **Custom domain?** Add a `CNAME` file with your domain name.
- **HTTPS required** for Web Bluetooth to work (GitHub Pages provides this automatically).

---

## Troubleshooting

**"Permission denied" error:**
- Set up SSH keys: https://docs.github.com/en/authentication
- Or use GitHub Desktop for easier auth

**"Repository not found":**
- Verify the repository exists at https://github.com/christo-steyn/webble
- Check you have push access

**Changes not showing:**
- GitHub Pages can take 1-2 minutes to update
- Hard refresh your browser (Ctrl+Shift+R)
- Check GitHub Actions tab for build errors
