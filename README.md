# SPECTRE

![License](https://img.shields.io/badge/license-MIT-blue)
![Language](https://img.shields.io/badge/language-JavaScript-yellow)
![Type](https://img.shields.io/badge/type-Web%20App-brightgreen)
![Client-Side](https://img.shields.io/badge/client--side-100%25-success)

**OSINT Intelligence Platform** — a single-file web application that aggregates dozens of open-source intelligence tools into one unified search interface. No server, no API keys, no install.

## Live Demo

**[Launch SPECTRE](https://sysadmindoc.github.io/SPECTRE/)**

Or download `index.html` and open it locally in any modern browser.

## Features

### People Search
Query multiple people-finder services simultaneously — TruePeopleSearch, WhitePages, Spokeo, PeekYou, FastPeopleSearch, and more — from a single form submission.

### Username Enumeration
Check a username across social platforms using WhatsMyName integration. Covers Twitter/X, Instagram, GitHub, Reddit, TikTok, LinkedIn, and 100+ others.

### Email Lookup
Cross-reference email addresses across breach databases (HaveIBeenPwned), social platforms, and email verification services in one click.

### Domain Intelligence
- **SSL Certificates** — Censys certificate transparency search
- **Internet-Connected Devices** — Shodan host lookup
- **DNS Records** — Full DNS enumeration (A, MX, TXT, NS, CNAME)
- **WHOIS** — Domain registration and ownership data

### Multi-Source Aggregation
All searches open results across multiple OSINT sources simultaneously in new tabs, saving hours of manual tab management.

### Themes
Includes Dark, Light, and Hacker (green terminal) theme options.

## Usage

1. Open the [live demo](https://sysadmindoc.github.io/SPECTRE/) or download `index.html`
2. Select a search category from the sidebar
3. Enter your target (name, username, email, or domain)
4. Click **Search** — results open across all relevant OSINT sources

## Technical

- **Single HTML file** — entire app is self-contained in `index.html`
- **Zero dependencies** — no npm, no build step, no CDN calls
- **100% client-side** — no data sent to any server
- **Works offline** — after initial download, no internet needed to load the app itself (searches still open external sites)

## Legal Notice

SPECTRE is intended for lawful OSINT research, due diligence, and educational purposes only. Only search for information you are legally authorized to access.

## License

MIT License
