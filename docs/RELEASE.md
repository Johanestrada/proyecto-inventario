# Releases

## Local commit

Generated files are excluded by `.gitignore`. Review and commit source files only:

```powershell
git status --short --ignored
git diff --check
git add .gitignore README.md backend frontend desktop .github docs
git diff --cached --stat
git diff --cached --check
git commit -m "Integra aplicacion de escritorio Tauri"
git push origin feature/desktop-client
```

## GitHub Release

Create a version tag after the commit is on GitHub:

```powershell
git tag v0.1.0
git push origin v0.1.0
```

The workflow `.github/workflows/release-windows.yml` runs on Windows and:

1. Installs Java and Node.js.
2. Builds and tests the backend.
3. Builds the Java app-image.
4. Verifies that the distribution has no database files.
5. Copies the server into Tauri resources.
6. Builds the NSIS installer.
7. Uploads the installer to the GitHub Release.

The installer is a Release asset, not a tracked repository file.

## Release asset

Expected asset name:

```text
Inventario_0.1.0_x64-setup.exe
```

If the asset is missing, inspect the failed job under the repository Actions tab.
