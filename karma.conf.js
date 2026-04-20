// Karma configuration for Angular tests.
//
// CHROME_BIN resolution order (first one that exists wins):
//   1. process.env.CHROME_BIN
//   2. /usr/bin/google-chrome, /usr/bin/chromium, /usr/bin/chromium-browser
//   3. puppeteer's bundled Chrome for Testing (devDependency)
//
// If the host image is missing GTK/ATK runtime libs Chromium expects,
// drop extracted shared objects at .chrome-deps/extracted/usr/lib64 and
// karma will prepend that directory to LD_LIBRARY_PATH automatically.
// See docs/dev/test-runner.md for the full setup.
const fs = require('node:fs');
const path = require('node:path');

function resolveChromeBin() {
  if (process.env['CHROME_BIN'] && fs.existsSync(process.env['CHROME_BIN'])) {
    return process.env['CHROME_BIN'];
  }
  const systemCandidates = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const candidate of systemCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  try {
    return require('puppeteer').executablePath();
  } catch {
    return undefined;
  }
}

const chromeBin = resolveChromeBin();
if (chromeBin) {
  process.env['CHROME_BIN'] = chromeBin;
}

const localLibDir = path.join(__dirname, '.chrome-deps', 'extracted', 'usr', 'lib64');
if (fs.existsSync(localLibDir)) {
  const existing = process.env['LD_LIBRARY_PATH'] ?? '';
  process.env['LD_LIBRARY_PATH'] = existing ? `${localLibDir}:${existing}` : localLibDir;
}

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: { jasmine: {}, clearContext: false },
    jasmineHtmlReporter: { suppressAll: true },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/web'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--headless=new']
      }
    },
    singleRun: false,
    restartOnFileChange: true
  });
};
