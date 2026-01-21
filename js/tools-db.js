/* ============================================
   SPECTRE - Tools Database
   Version: 2.0.0 (Modular)
   
   This file contains all OSINT tool definitions.
   Easy to update: just add/modify entries in the
   appropriate category.
   
   Available badge types: free, freemium, paid, cli
   ============================================ */

const SPECTRE_TOOLS = {
    // People Search
    people: {
        name: "People Search",
        icon: "👤",
        desc: "Search public records, background checks, and people databases",
        tools: [
            { name: "TruePeopleSearch", url: "https://www.truepeoplesearch.com/results?name={first}%20{last}", badge: "free", fields: ["firstName", "lastName"], desc: "Free comprehensive US people search" },
            { name: "FastPeopleSearch", url: "https://www.fastpeoplesearch.com/name/{first}-{last}", badge: "free", fields: ["firstName", "lastName"], desc: "Quick US people lookup" },
            { name: "ThatsThem", url: "https://thatsthem.com/name/{First}-{Last}", badge: "free", fields: ["firstName", "lastName"], desc: "Free people search with IP history" },
            { name: "FamilyTreeNow", url: "https://www.familytreenow.com/search/people/results?first={first}&last={last}", badge: "free", fields: ["firstName", "lastName"], desc: "Genealogy-based people search" },
            { name: "Nuwber", url: "https://nuwber.com/search?name={first}+{last}", badge: "free", fields: ["firstName", "lastName"], desc: "People search with social profiles" },
            { name: "Spokeo", url: "https://www.spokeo.com/{First}-{Last}", badge: "freemium", fields: ["firstName", "lastName"], desc: "Aggregated people search engine" },
            { name: "BeenVerified", url: "https://www.beenverified.com/people/{first}-{last}/", badge: "freemium", fields: ["firstName", "lastName"], desc: "Background check service" },
            { name: "Pipl", url: "https://pipl.com/search/?q={first}+{last}", badge: "paid", fields: ["firstName", "lastName"], desc: "Professional identity resolution" },
        ]
    },

    // Social Media
    social: {
        name: "Social Media",
        icon: "💬",
        desc: "Direct links to social media profiles",
        tools: [
            { name: "Twitter/X", url: "https://twitter.com/{username}", badge: "free", fields: ["username"], desc: "View Twitter/X profile" },
            { name: "Instagram", url: "https://www.instagram.com/{username}/", badge: "free", fields: ["username"], desc: "View Instagram profile" },
            { name: "Facebook", url: "https://www.facebook.com/{username}", badge: "free", fields: ["username"], desc: "View Facebook profile" },
            { name: "LinkedIn", url: "https://www.linkedin.com/in/{username}/", badge: "free", fields: ["username"], desc: "View LinkedIn profile" },
            { name: "TikTok", url: "https://www.tiktok.com/@{username}", badge: "free", fields: ["username"], desc: "View TikTok profile" },
            { name: "Reddit", url: "https://www.reddit.com/user/{username}", badge: "free", fields: ["username"], desc: "View Reddit profile" },
            { name: "YouTube", url: "https://www.youtube.com/@{username}", badge: "free", fields: ["username"], desc: "View YouTube channel" },
            { name: "GitHub", url: "https://github.com/{username}", badge: "free", fields: ["username"], desc: "View GitHub profile" },
            { name: "Twitch", url: "https://www.twitch.tv/{username}", badge: "free", fields: ["username"], desc: "View Twitch profile" },
            { name: "Threads", url: "https://www.threads.net/@{username}", badge: "free", fields: ["username"], desc: "View Threads profile" },
            { name: "Bluesky", url: "https://bsky.app/profile/{username}.bsky.social", badge: "free", fields: ["username"], desc: "View Bluesky profile" },
        ]
    },

    // Username OSINT
    username: {
        name: "Username OSINT",
        icon: "🔎",
        desc: "Check username across platforms",
        tools: [
            { name: "Namechk", url: "https://namechk.com/", badge: "free", fields: ["username"], desc: "Check 100+ social networks" },
            { name: "KnowEm", url: "https://knowem.com/checkusernames.php?u={username}", badge: "free", fields: ["username"], desc: "Username search 500+ sites" },
            { name: "WhatsMyName", url: "https://whatsmyname.app/", badge: "free", fields: ["username"], desc: "OSINT username enumeration" },
            { name: "UserSearch", url: "https://usersearch.org/results_normal.php?URL_username={username}", badge: "free", fields: ["username"], desc: "Social site username search" },
            { name: "Sherlock", url: "https://github.com/sherlock-project/sherlock", badge: "cli", fields: ["username"], desc: "CLI: Hunt usernames 400+ sites" },
            { name: "Maigret", url: "https://github.com/soxoj/maigret", badge: "cli", fields: ["username"], desc: "CLI: Dossier by username" },
        ]
    },

    // Email Intelligence
    email: {
        name: "Email Intelligence",
        icon: "📧",
        desc: "Email verification and breach checking",
        tools: [
            { name: "Have I Been Pwned", url: "https://haveibeenpwned.com/account/{email}", badge: "free", fields: ["email"], desc: "Check email in breaches" },
            { name: "EmailRep.io", url: "https://emailrep.io/{email}", badge: "free", fields: ["email"], desc: "Email reputation scoring" },
            { name: "Hunter.io", url: "https://hunter.io/email-verifier/{email}", badge: "freemium", fields: ["email"], desc: "Email verification" },
            { name: "Epieos", url: "https://epieos.com/?q={email}", badge: "free", fields: ["email"], desc: "Google account discovery" },
            { name: "Holehe", url: "https://github.com/megadose/holehe", badge: "cli", fields: ["email"], desc: "CLI: Check email registrations" },
        ]
    },

    // Phone Lookup
    phone: {
        name: "Phone Lookup",
        icon: "📱",
        desc: "Reverse phone lookups",
        tools: [
            { name: "TrueCaller", url: "https://www.truecaller.com/search/{country}/{phoneClean}", badge: "freemium", fields: ["phone", "country"], desc: "Global caller ID" },
            { name: "ThatsThem Phone", url: "https://thatsthem.com/phone/{phoneClean}", badge: "free", fields: ["phone"], desc: "Free reverse phone" },
            { name: "Spy Dialer", url: "https://spydialer.com/default.aspx?rp={phoneClean}", badge: "free", fields: ["phone"], desc: "Free phone lookup" },
            { name: "Carrier Lookup", url: "https://freecarrierlookup.com/", badge: "free", fields: ["phone"], desc: "Identify carrier" },
            { name: "PhoneInfoga", url: "https://github.com/sundowndev/phoneinfoga", badge: "cli", fields: ["phone"], desc: "CLI: Phone OSINT" },
        ]
    },

    // Domain & DNS
    domain: {
        name: "Domain & DNS",
        icon: "🌐",
        desc: "WHOIS, DNS, certificates",
        tools: [
            { name: "WHOIS", url: "https://www.whois.com/whois/{domain}", badge: "free", fields: ["domain"], desc: "Domain registration info" },
            { name: "DNSdumpster", url: "https://dnsdumpster.com/", badge: "free", fields: ["domain"], desc: "DNS recon and mapping" },
            { name: "crt.sh", url: "https://crt.sh/?q={domain}", badge: "free", fields: ["domain"], desc: "Certificate transparency" },
            { name: "SecurityTrails", url: "https://securitytrails.com/domain/{domain}/dns", badge: "freemium", fields: ["domain"], desc: "Historical DNS data" },
            { name: "VirusTotal", url: "https://www.virustotal.com/gui/domain/{domain}", badge: "free", fields: ["domain"], desc: "Domain security" },
            { name: "Shodan", url: "https://www.shodan.io/search?query=hostname:{domain}", badge: "freemium", fields: ["domain"], desc: "Device search" },
            { name: "BuiltWith", url: "https://builtwith.com/{domain}", badge: "freemium", fields: ["domain"], desc: "Technology profiler" },
            { name: "URLScan", url: "https://urlscan.io/search/#domain:{domain}", badge: "free", fields: ["domain"], desc: "Website scanner" },
        ]
    },

    // IP & Network
    ip: {
        name: "IP & Network",
        icon: "🔌",
        desc: "IP geolocation and reputation",
        tools: [
            { name: "Shodan IP", url: "https://www.shodan.io/host/{ip}", badge: "freemium", fields: ["ip"], desc: "Ports and services" },
            { name: "VirusTotal IP", url: "https://www.virustotal.com/gui/ip-address/{ip}", badge: "free", fields: ["ip"], desc: "IP reputation" },
            { name: "IPinfo", url: "https://ipinfo.io/{ip}", badge: "freemium", fields: ["ip"], desc: "Geolocation and ASN" },
            { name: "AbuseIPDB", url: "https://www.abuseipdb.com/check/{ip}", badge: "free", fields: ["ip"], desc: "Abuse reports" },
            { name: "GreyNoise", url: "https://viz.greynoise.io/ip/{ip}", badge: "freemium", fields: ["ip"], desc: "Background noise" },
            { name: "BGP Toolkit", url: "https://bgp.he.net/ip/{ip}", badge: "free", fields: ["ip"], desc: "BGP/ASN info" },
        ]
    },

    // Breach & Leaks
    breach: {
        name: "Breach & Leaks",
        icon: "🔓",
        desc: "Data breach search",
        tools: [
            { name: "Have I Been Pwned", url: "https://haveibeenpwned.com/account/{email}", badge: "free", fields: ["email"], desc: "Check breaches" },
            { name: "DeHashed", url: "https://dehashed.com/search?query={email}", badge: "paid", fields: ["email"], desc: "Leaked credentials" },
            { name: "LeakCheck", url: "https://leakcheck.io/", badge: "freemium", fields: ["email"], desc: "Breach lookup" },
            { name: "IntelligenceX", url: "https://intelx.io/?s={email}", badge: "freemium", fields: ["email"], desc: "Historical data" },
            { name: "BreachDirectory", url: "https://breachdirectory.org/", badge: "free", fields: ["email"], desc: "Free breach search" },
        ]
    },

    // Web Archives
    archive: {
        name: "Web Archives",
        icon: "🗄️",
        desc: "Historical snapshots",
        tools: [
            { name: "Wayback Machine", url: "https://web.archive.org/web/*/{domain}", badge: "free", fields: ["domain"], desc: "Website history" },
            { name: "Google Cache", url: "https://webcache.googleusercontent.com/search?q=cache:{domain}", badge: "free", fields: ["domain"], desc: "Cached version" },
            { name: "Archive.today", url: "https://archive.today/{domain}", badge: "free", fields: ["domain"], desc: "Snapshot service" },
        ]
    },

    // Image Search
    image: {
        name: "Image Search",
        icon: "🖼️",
        desc: "Reverse image search",
        tools: [
            { name: "Google Lens", url: "https://lens.google.com/uploadbyurl?url={imageUrl}", badge: "free", fields: ["imageUrl"], desc: "Visual search" },
            { name: "TinEye", url: "https://tineye.com/search?url={imageUrl}", badge: "free", fields: ["imageUrl"], desc: "Reverse image" },
            { name: "Yandex", url: "https://yandex.com/images/search?rpt=imageview&url={imageUrl}", badge: "free", fields: ["imageUrl"], desc: "Face search" },
            { name: "PimEyes", url: "https://pimeyes.com/en", badge: "paid", fields: ["imageUrl"], desc: "Facial recognition" },
            { name: "FotoForensics", url: "https://fotoforensics.com/", badge: "free", fields: ["imageUrl"], desc: "Image analysis" },
        ]
    },

    // Business Intel
    business: {
        name: "Business Intel",
        icon: "🏢",
        desc: "Corporate filings and records",
        tools: [
            { name: "OpenCorporates", url: "https://opencorporates.com/companies?q={company}", badge: "freemium", fields: ["company"], desc: "200M+ company records" },
            { name: "SEC EDGAR", url: "https://www.sec.gov/cgi-bin/browse-edgar?company={company}&action=getcompany", badge: "free", fields: ["company"], desc: "SEC filings" },
            { name: "Crunchbase", url: "https://www.crunchbase.com/textsearch?q={company}", badge: "freemium", fields: ["company"], desc: "Startup database" },
            { name: "LinkedIn", url: "https://www.linkedin.com/company/{company}/", badge: "free", fields: ["company"], desc: "Company page" },
            { name: "Glassdoor", url: "https://www.glassdoor.com/Search/results.htm?keyword={company}", badge: "free", fields: ["company"], desc: "Reviews & salaries" },
            { name: "ICIJ Offshore", url: "https://offshoreleaks.icij.org/search?q={company}", badge: "free", fields: ["company"], desc: "Panama Papers" },
        ]
    },

    // Search Engines
    search: {
        name: "Search Engines",
        icon: "🔍",
        desc: "General search engines",
        tools: [
            { name: "Google", url: "https://www.google.com/search?q={first}+{last}", badge: "free", fields: ["firstName", "lastName"], desc: "Google search" },
            { name: "Google Exact", url: "https://www.google.com/search?q=%22{first}+{last}%22", badge: "free", fields: ["firstName", "lastName"], desc: "Exact match" },
            { name: "DuckDuckGo", url: "https://duckduckgo.com/?q={first}+{last}", badge: "free", fields: ["firstName", "lastName"], desc: "Privacy search" },
            { name: "Bing", url: "https://www.bing.com/search?q={first}+{last}", badge: "free", fields: ["firstName", "lastName"], desc: "Bing search" },
            { name: "Yandex", url: "https://yandex.com/search/?text={first}+{last}", badge: "free", fields: ["firstName", "lastName"], desc: "Russian search" },
        ]
    },

    // OSINT Frameworks
    frameworks: {
        name: "OSINT Frameworks",
        icon: "🔧",
        desc: "Tool collections and resources",
        tools: [
            { name: "OSINT Framework", url: "https://osintframework.com/", badge: "free", fields: [], desc: "Tool directory" },
            { name: "IntelTechniques", url: "https://inteltechniques.com/tools/", badge: "free", fields: [], desc: "Bazzell's tools" },
            { name: "Bellingcat", url: "https://bellingcat.gitbook.io/toolkit/", badge: "free", fields: [], desc: "Journalism toolkit" },
            { name: "Awesome OSINT", url: "https://github.com/jivoi/awesome-osint", badge: "free", fields: [], desc: "Curated list" },
            { name: "Maltego", url: "https://www.maltego.com/", badge: "freemium", fields: [], desc: "Link analysis" },
            { name: "SpiderFoot", url: "https://github.com/smicallef/spiderfoot", badge: "cli", fields: [], desc: "CLI: Automation" },
        ]
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.SPECTRE_TOOLS = SPECTRE_TOOLS;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_TOOLS;
}
