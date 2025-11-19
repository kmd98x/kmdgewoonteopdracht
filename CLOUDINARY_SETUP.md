# Cloudinary Setup Guide

This app uses Cloudinary to store images instead of localStorage, which solves storage quota issues.

## Setup Steps

1. **Create a Cloudinary Account** (Free tier available)
   - Go to https://cloudinary.com/users/register/free
   - Sign up for a free account

2. **Get Your Cloud Name**
   - After signing up, go to your Dashboard
   - Your **Cloud Name** is displayed at the top of the dashboard
   - Copy this value

3. **Create an Upload Preset**
   - Go to **Settings** → **Upload** tab
   - Scroll down to **Upload presets** section
   - Click **Add upload preset**
   - Set the following:
     - **Preset name**: `lunchwheel-upload` (or any name you prefer)
     - **Signing mode**: Select **Unsigned** (required for client-side uploads)
     - **Folder**: `lunchwheel` (optional, but helps organize images)
   - Click **Save**

4. **For Local Development - Create Environment File**
   - Create a `.env` file in the project root
   - Add the following variables:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
   VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset-name-here
   ```
   - Replace `your-cloud-name-here` with your actual Cloud Name
   - Replace `your-upload-preset-name-here` with your Upload Preset name
   - Restart your dev server (Ctrl+C, then `npm run dev`)

5. **For GitHub Pages Deployment - Set GitHub Secrets**
   - Go to your GitHub repository
   - Click **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Add two secrets:
     - **Name**: `CLOUDINARY_CLOUD_NAME`
       **Value**: Your Cloudinary cloud name
     - **Name**: `CLOUDINARY_UPLOAD_PRESET`
       **Value**: Your upload preset name
   - The GitHub Actions workflow will automatically use these secrets during build

## Example `.env` file:
```
VITE_CLOUDINARY_CLOUD_NAME=my-awesome-cloud
VITE_CLOUDINARY_UPLOAD_PRESET=lunchwheel-upload
```

## Notes

- The `.env` file should be added to `.gitignore` to keep your credentials private
- For production deployments on GitHub Pages, use GitHub Secrets (not `.env` files)
- Images are automatically resized to max 800px and compressed to 70% quality before upload
- All images are stored in the `lunchwheel` folder on Cloudinary
- The app maintains backward compatibility with old base64 images stored in localStorage

## GitHub Pages Deployment

When deploying to GitHub Pages via GitHub Actions:
1. Set up GitHub Secrets as described in step 5 above
2. The workflow (`.github/workflows/deploy.yml`) will automatically use these secrets during the build
3. No `.env` file is needed for production - GitHub Secrets are used instead

## Troubleshooting

If you see "Cloudinary configuration missing" error:
- Make sure your `.env` file is in the project root (same level as `package.json`)
- Make sure variable names start with `VITE_` (required for Vite)
- Restart your dev server after creating/modifying `.env`
- Check that your Cloud Name and Upload Preset name are correct

