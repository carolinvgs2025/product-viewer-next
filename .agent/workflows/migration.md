---
description: How to migrate the product-viewer-next project to another computer
---

# Project Migration Guide

To move this project to a new computer, you have two main options. **Option 1 (GitHub/Git)** is highly recommended as it keeps your code safe and makes future updates easy.

## Option 1: Use GitHub (Recommended)

This is the professional way to move and version your code.

### 1. On Current Computer
1. Create a new repository on [GitHub](https://github.com/new).
2. Open your terminal in the project folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### 2. On New Computer
1. Install [Node.js](https://nodejs.org/).
2. Open terminal and run:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   npm install
   npm run dev
   ```

---

## Option 2: Manual Zip and Move

If you don't want to use GitHub, you can zip the files. **Important: Do not zip the `node_modules` folder** as it is massive and can be recreated easily.

### 1. On Current Computer
1. Create a zip file of the `product-viewer-next` folder.
2. **Exclude** these folders if possible (to save space):
   - `node_modules`
   - `.next`
3. Transfer the zip file via USB, Cloud Drive (Google Drive/Dropbox), or AirDrop.

### 2. On New Computer
1. Install [Node.js](https://nodejs.org/).
2. Unzip the folder.
3. Open terminal in that folder and run:
   ```bash
   npm install
   npm run dev
   ```

## Prerequisites Checklist
- [ ] **Node.js**: Installed on the new computer (Version 18 or higher recommended).
- [ ] **Visual Studio Code**: (Optional) For editing code.
- [ ] **Git**: (Optional) If using Option 1.
