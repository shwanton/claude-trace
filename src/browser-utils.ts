import { spawn } from "child_process";
import * as path from "path";

export type BrowserName = "default" | "chrome" | "firefox" | "safari" | string;

interface BrowserConfig {
	command: string;
	args: string[];
}

/**
 * Get the platform-specific browser configuration
 */
function getBrowserConfig(browser: BrowserName, filePath: string): BrowserConfig {
	const platform = process.platform;

	// Handle custom browser path (absolute path)
	if (browser && (browser.startsWith("/") || browser.startsWith("~") || path.isAbsolute(browser))) {
		return {
			command: browser,
			args: [filePath],
		};
	}

	// Normalize browser name
	const browserLower = browser?.toLowerCase() || "default";

	if (platform === "darwin") {
		// macOS
		switch (browserLower) {
			case "chrome":
				return { command: "open", args: ["-a", "Google Chrome", filePath] };
			case "firefox":
				return { command: "open", args: ["-a", "Firefox", filePath] };
			case "safari":
				return { command: "open", args: ["-a", "Safari", filePath] };
			case "edge":
				return { command: "open", args: ["-a", "Microsoft Edge", filePath] };
			case "brave":
				return { command: "open", args: ["-a", "Brave Browser", filePath] };
			case "arc":
				return { command: "open", args: ["-a", "Arc", filePath] };
			default:
				return { command: "open", args: [filePath] };
		}
	} else if (platform === "win32") {
		// Windows
		switch (browserLower) {
			case "chrome":
				return { command: "cmd", args: ["/c", "start", "chrome", filePath] };
			case "firefox":
				return { command: "cmd", args: ["/c", "start", "firefox", filePath] };
			case "edge":
				return { command: "cmd", args: ["/c", "start", "msedge", filePath] };
			case "brave":
				return { command: "cmd", args: ["/c", "start", "brave", filePath] };
			default:
				return { command: "cmd", args: ["/c", "start", "", filePath] };
		}
	} else {
		// Linux and others
		switch (browserLower) {
			case "chrome":
				return { command: "google-chrome", args: [filePath] };
			case "chromium":
				return { command: "chromium", args: [filePath] };
			case "firefox":
				return { command: "firefox", args: [filePath] };
			case "brave":
				return { command: "brave-browser", args: [filePath] };
			default:
				// Use xdg-open for default browser on Linux
				return { command: "xdg-open", args: [filePath] };
		}
	}
}

/**
 * Open a file in a browser
 * @param filePath Path to the file to open
 * @param browser Browser to use (default, chrome, firefox, safari, or custom path)
 * @returns true if spawn was successful, false otherwise
 */
export function openInBrowser(filePath: string, browser: BrowserName = "default"): boolean {
	try {
		const config = getBrowserConfig(browser, filePath);
		const child = spawn(config.command, config.args, {
			detached: true,
			stdio: "ignore",
		});
		child.unref();
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Get a human-readable browser description for logging
 */
export function getBrowserDescription(browser: BrowserName): string {
	if (!browser || browser === "default") {
		return "default browser";
	}
	if (browser.startsWith("/") || browser.startsWith("~") || path.isAbsolute(browser)) {
		return `custom browser (${browser})`;
	}
	return browser;
}
