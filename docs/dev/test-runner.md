# Headless test runner (Karma + axe-core + Lighthouse)

## CHROME_BIN resolution

`karma.conf.js` resolves a Chromium binary for `ChromeHeadlessCI` in this order:

1. `process.env.CHROME_BIN` (if the path exists).
2. System Chrome/Chromium at `/usr/bin/google-chrome`, `/usr/bin/chromium`, `/usr/bin/chromium-browser`.
3. Puppeteer's bundled Chrome for Testing (via `require('puppeteer').executablePath()`).

No host-level setup is required on a standard Linux or macOS dev machine after `npm ci` — `puppeteer` downloads Chrome for Testing on install.

## CI

GitHub Actions uses `browser-actions/setup-chrome@v1` (pinned to `chrome-version: stable`) and exports the binary path into `CHROME_BIN` / `CHROME_PATH` so Karma and Lighthouse run against the same browser version. See `.github/workflows/ci.yml`.

## Sandbox / minimal-image workaround

If the host image is missing the GTK/ATK runtime libs Chromium needs (common on stripped RHEL / Alpine / container images), `ldd` will report:

```
libatk-bridge-2.0.so.0 => not found
libasound.so.2        => not found
libatspi.so.0         => not found
```

Drop the matching shared objects at `.chrome-deps/extracted/usr/lib64/`. `karma.conf.js` prepends that directory to `LD_LIBRARY_PATH` automatically when the folder exists. Everything under `.chrome-deps/` is gitignored.

On RHEL 8 hosts without sudo, `dnf download --resolve at-spi2-atk alsa-lib at-spi2-core libXtst` produces the RPMs; `rpm2cpio <rpm> | cpio -idmu` extracts them into the `.chrome-deps/extracted/` tree.

## Commands

| Command | What it runs |
| --- | --- |
| `npm test` | Karma + Jasmine (unit + axe + keyboard smoke), single-run, `ChromeHeadlessCI`. |
| `npm run lhci` | Lighthouse CI against `/`, `/sandbox/tokens`, `/classroom`. Requires `npm run build` first. |
