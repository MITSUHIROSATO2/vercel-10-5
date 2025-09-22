import { chromium, Browser, Page, ConsoleMessage } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  type: string;
  text: string;
  location?: string;
  args?: any[];
}

class ConsoleMonitor {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private logFile: string;
  private logs: LogEntry[] = [];
  private isMonitoring: boolean = false;

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFile = path.join(logsDir, `console-${new Date().toISOString().split('T')[0]}.log`);
  }

  async start(url: string = 'http://localhost:3000') {
    console.log('🔍 Starting console monitoring...');

    try {
      // Launch browser
      this.browser = await chromium.launch({
        headless: false, // Set to true for background monitoring
        devtools: true,
      });

      // Create new page
      this.page = await this.browser.newPage();

      // Set up console event listener
      this.page.on('console', (msg: ConsoleMessage) => {
        this.handleConsoleMessage(msg);
      });

      // Set up page error listener
      this.page.on('pageerror', (error: Error) => {
        this.handlePageError(error);
      });

      // Set up request failed listener
      this.page.on('requestfailed', request => {
        this.logEntry({
          timestamp: new Date().toISOString(),
          type: 'REQUEST_FAILED',
          text: `Request failed: ${request.url()}`,
          location: request.failure()?.errorText,
        });
      });

      // Navigate to the application
      console.log(`📱 Navigating to ${url}...`);
      await this.page.goto(url, { waitUntil: 'networkidle' });

      this.isMonitoring = true;
      console.log('✅ Console monitoring started successfully!');
      console.log(`📁 Logs are being saved to: ${this.logFile}`);
      console.log('Press Ctrl+C to stop monitoring...\n');

      // Keep the script running
      await this.keepAlive();

    } catch (error) {
      console.error('❌ Error starting console monitor:', error);
      await this.stop();
    }
  }

  private async handleConsoleMessage(msg: ConsoleMessage) {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    // Color code based on message type
    let prefix = '';
    let color = '\x1b[0m'; // Reset

    switch(type) {
      case 'error':
        prefix = '❌ ERROR';
        color = '\x1b[31m'; // Red
        break;
      case 'warning':
        prefix = '⚠️  WARN';
        color = '\x1b[33m'; // Yellow
        break;
      case 'info':
        prefix = 'ℹ️  INFO';
        color = '\x1b[36m'; // Cyan
        break;
      case 'log':
        prefix = '📝 LOG';
        color = '\x1b[37m'; // White
        break;
      case 'debug':
        prefix = '🐛 DEBUG';
        color = '\x1b[35m'; // Magenta
        break;
      default:
        prefix = '📌 ' + type.toUpperCase();
    }

    // Format and display the message
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const locationStr = location.url !== 'about:blank' ? ` [${location.url}:${location.lineNumber}]` : '';

    console.log(`${color}[${timestamp}] ${prefix}: ${text}${locationStr}\x1b[0m`);

    // Special handling for specific error patterns
    if (type === 'error' || text.includes('Error') || text.includes('Failed')) {
      await this.analyzeError(text, location);
    }

    // Log to file
    this.logEntry({
      timestamp: new Date().toISOString(),
      type,
      text,
      location: locationStr,
      args: await this.extractArgs(msg),
    });
  }

  private async extractArgs(msg: ConsoleMessage): Promise<any[]> {
    const args = [];
    for (const arg of msg.args()) {
      try {
        args.push(await arg.jsonValue());
      } catch {
        args.push(arg.toString());
      }
    }
    return args;
  }

  private handlePageError(error: Error) {
    console.error('🚨 PAGE ERROR:', error.message);
    this.logEntry({
      timestamp: new Date().toISOString(),
      type: 'PAGE_ERROR',
      text: error.message,
      location: error.stack,
    });
  }

  private async analyzeError(text: string, location: any) {
    // Analyze specific error patterns
    if (text.includes('WebGL')) {
      console.log('\n🎮 WebGL Issue Detected!');
      console.log('  Possible causes:');
      console.log('  - Multiple Canvas instances');
      console.log('  - Context loss');
      console.log('  - Memory leak');
    } else if (text.includes('THREE')) {
      console.log('\n🎨 Three.js Issue Detected!');
      console.log('  Check model loading and disposal');
    } else if (text.includes('fetch') || text.includes('API')) {
      console.log('\n🌐 API Issue Detected!');
      console.log('  Check network requests and API endpoints');
    }
  }

  private logEntry(entry: LogEntry) {
    this.logs.push(entry);

    // Write to file
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logFile, logLine);
  }

  private async keepAlive() {
    // Keep the process running
    return new Promise((resolve) => {
      process.on('SIGINT', async () => {
        console.log('\n👋 Stopping console monitor...');
        await this.stop();
        resolve(undefined);
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

    console.log('✅ Console monitoring stopped.');
    process.exit(0);
  }

  private saveSummary() {
    const summary = {
      totalLogs: this.logs.length,
      errors: this.logs.filter(l => l.type === 'error' || l.type === 'PAGE_ERROR').length,
      warnings: this.logs.filter(l => l.type === 'warning').length,
      info: this.logs.filter(l => l.type === 'info').length,
      debug: this.logs.filter(l => l.type === 'debug').length,
      startTime: this.logs[0]?.timestamp,
      endTime: this.logs[this.logs.length - 1]?.timestamp,
    };

    console.log('\n📊 Session Summary:');
    console.log(`  Total logs: ${summary.totalLogs}`);
    console.log(`  Errors: ${summary.errors}`);
    console.log(`  Warnings: ${summary.warnings}`);
    console.log(`  Info: ${summary.info}`);
    console.log(`  Debug: ${summary.debug}`);

    const summaryFile = this.logFile.replace('.log', '-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`\n📁 Summary saved to: ${summaryFile}`);
  }

  // Test avatar switching
  async testAvatarSwitching() {
    if (!this.page) return;

    console.log('\n🧪 Testing avatar switching...');

    const avatarButtons = [
      { selector: 'button:has-text("男性１")', name: 'Male 1' },
      { selector: 'button:has-text("男性２")', name: 'Male 2' },
      { selector: 'button:has-text("女性")', name: 'Female' },
    ];

    for (const avatar of avatarButtons) {
      try {
        console.log(`  Clicking ${avatar.name}...`);
        await this.page.click(avatar.selector);
        await this.page.waitForTimeout(3000); // Wait for model to load
      } catch (error) {
        console.error(`  Failed to click ${avatar.name}:`, error);
      }
    }

    console.log('✅ Avatar switching test completed');
  }
}

// Main execution
async function main() {
  const monitor = new ConsoleMonitor();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const url = args[0] || 'http://localhost:3000';
  const testMode = args.includes('--test');

  await monitor.start(url);

  // Run tests if requested
  if (testMode) {
    await monitor.testAvatarSwitching();
  }
}

// Run the monitor
main().catch(console.error);