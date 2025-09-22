const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class ConsoleMonitor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.logs = [];
    this.isMonitoring = false;

    // Create logs directory
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    this.logFile = path.join(logsDir, `console-${timestamp}.log`);
  }

  async start(url = 'http://localhost:3000') {
    console.log('🔍 コンソール監視を開始します...');
    console.log('=' .repeat(50));

    try {
      // Launch browser
      this.browser = await chromium.launch({
        headless: false, // ブラウザを表示
        devtools: true,  // 開発者ツールを開く
      });

      // Create new page
      this.page = await this.browser.newPage();

      // Set up console event listener
      this.page.on('console', msg => this.handleConsoleMessage(msg));

      // Set up page error listener
      this.page.on('pageerror', error => this.handlePageError(error));

      // Set up request failed listener
      this.page.on('requestfailed', request => {
        this.logEntry({
          timestamp: new Date().toISOString(),
          type: 'REQUEST_FAILED',
          text: `リクエスト失敗: ${request.url()}`,
          error: request.failure()?.errorText,
        });
      });

      // Set up response listener for errors
      this.page.on('response', response => {
        if (response.status() >= 400) {
          this.logEntry({
            timestamp: new Date().toISOString(),
            type: 'HTTP_ERROR',
            text: `HTTP ${response.status()}: ${response.url()}`,
          });
        }
      });

      // Navigate to the application
      console.log(`\n📱 ${url} にアクセス中...`);
      await this.page.goto(url, { waitUntil: 'networkidle' });

      this.isMonitoring = true;
      console.log('\n✅ コンソール監視を開始しました！');
      console.log(`📁 ログファイル: ${this.logFile}`);
      console.log('\nCtrl+C で監視を停止します...\n');
      console.log('=' .repeat(50));

      // Keep the script running
      await this.keepAlive();

    } catch (error) {
      console.error('❌ エラーが発生しました:', error);
      await this.stop();
    }
  }

  async handleConsoleMessage(msg) {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    // Color codes for terminal output
    const colors = {
      error: '\x1b[31m',    // Red
      warning: '\x1b[33m',  // Yellow
      info: '\x1b[36m',     // Cyan
      log: '\x1b[37m',      // White
      debug: '\x1b[35m',    // Magenta
      reset: '\x1b[0m'
    };

    const icons = {
      error: '❌',
      warning: '⚠️ ',
      info: 'ℹ️ ',
      log: '📝',
      debug: '🐛'
    };

    const color = colors[type] || colors.log;
    const icon = icons[type] || '📌';

    // Format timestamp
    const timestamp = new Date().toLocaleTimeString('ja-JP');

    // Format location
    const locationStr = location.url !== 'about:blank'
      ? ` [${path.basename(location.url)}:${location.lineNumber}]`
      : '';

    // Display in console
    console.log(`${color}[${timestamp}] ${icon} ${type.toUpperCase()}: ${text}${locationStr}${colors.reset}`);

    // Special handling for WebGL and Three.js errors
    if (text.includes('WebGL') || text.includes('Context Lost')) {
      console.log('  🎮 WebGL問題検出！');
      if (text.includes('Context Lost')) {
        console.log('    → WebGLコンテキストが失われました');
        console.log('    → 解決策: Canvas の再作成またはページリロードが必要です');
      }
    }

    if (text.includes('THREE')) {
      console.log('  🎨 Three.js問題検出！');
      if (text.includes('dispose')) {
        console.log('    → リソースの解放に問題があります');
      }
      if (text.includes('geometry') || text.includes('material')) {
        console.log('    → メモリリークの可能性があります');
      }
    }

    // Log to file
    this.logEntry({
      timestamp: new Date().toISOString(),
      type,
      text,
      location: locationStr,
    });
  }

  handlePageError(error) {
    console.error('🚨 ページエラー:', error.message);
    this.logEntry({
      timestamp: new Date().toISOString(),
      type: 'PAGE_ERROR',
      text: error.message,
      stack: error.stack,
    });
  }

  logEntry(entry) {
    this.logs.push(entry);

    // Write to file
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logFile, logLine);
  }

  async keepAlive() {
    return new Promise((resolve) => {
      process.on('SIGINT', async () => {
        console.log('\n\n👋 監視を停止しています...');
        await this.stop();
        resolve();
      });
    });
  }

  async stop() {
    this.isMonitoring = false;

    // Save summary
    this.saveSummary();

    // Close browser
    if (this.browser) {
      await this.browser.close();
    }

    console.log('✅ 監視を停止しました。');
    process.exit(0);
  }

  saveSummary() {
    const errorLogs = this.logs.filter(l => l.type === 'error' || l.type === 'PAGE_ERROR');
    const warningLogs = this.logs.filter(l => l.type === 'warning');

    console.log('\n' + '=' .repeat(50));
    console.log('📊 セッションサマリー:');
    console.log(`  総ログ数: ${this.logs.length}`);
    console.log(`  エラー: ${errorLogs.length}`);
    console.log(`  警告: ${warningLogs.length}`);

    if (errorLogs.length > 0) {
      console.log('\n🔴 主要なエラー:');
      errorLogs.slice(0, 5).forEach(log => {
        console.log(`  - ${log.text.substring(0, 100)}...`);
      });
    }

    // Save detailed summary to JSON
    const summary = {
      totalLogs: this.logs.length,
      errors: errorLogs.length,
      warnings: warningLogs.length,
      startTime: this.logs[0]?.timestamp,
      endTime: this.logs[this.logs.length - 1]?.timestamp,
      errorDetails: errorLogs,
      warningDetails: warningLogs
    };

    const summaryFile = this.logFile.replace('.log', '-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`\n📁 詳細サマリー: ${summaryFile}`);
    console.log('=' .repeat(50));
  }

  // Test avatar switching automatically
  async testAvatarSwitching() {
    if (!this.page) return;

    console.log('\n🧪 アバター切り替えテストを実行中...');

    const avatarButtons = [
      { text: '男性１', name: 'Male 1' },
      { text: '男性２', name: 'Male 2' },
      { text: '女性', name: 'Female' },
    ];

    for (const avatar of avatarButtons) {
      try {
        console.log(`  ${avatar.name} に切り替え中...`);

        // Find and click the button
        const button = await this.page.locator(`button:has-text("${avatar.text}")`);
        await button.click();

        // Wait for model to load
        await this.page.waitForTimeout(3000);

        console.log(`  ✓ ${avatar.name} 切り替え完了`);
      } catch (error) {
        console.error(`  ✗ ${avatar.name} 切り替え失敗:`, error.message);
      }
    }

    console.log('✅ アバターテスト完了\n');
  }
}

// Main execution
async function main() {
  const monitor = new ConsoleMonitor();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const url = args.find(arg => arg.startsWith('http')) || 'http://localhost:3000';
  const shouldTest = args.includes('--test');

  // Start monitoring
  await monitor.start(url);

  // Run tests if requested
  if (shouldTest) {
    setTimeout(async () => {
      await monitor.testAvatarSwitching();
    }, 5000); // Wait 5 seconds before testing
  }
}

// Install Playwright browsers if needed
const { execSync } = require('child_process');
try {
  execSync('npx playwright install chromium', { stdio: 'ignore' });
} catch (e) {
  // Browsers already installed
}

// Run the monitor
main().catch(console.error);