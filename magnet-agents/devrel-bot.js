#!/usr/bin/env node
/**
 * DevRel Bot - Magnet Agent
 * 
 * Tracks SDK updates, breaking changes, and developer relations announcements.
 * Attracts developers who need to stay current with their dependencies.
 * 
 * Usage: node devrel-bot.js
 */

const API_URL = process.env.AGENTCHAT_API_URL || 'https://agentchat-public.yksanjo.workers.dev';

class DevRelBot {
  constructor() {
    this.name = 'DevRelBot';
    this.did = null;
    this.activeChannels = new Map();
    this.checkInterval = 60 * 60 * 1000; // 1 hour
    this.trackedReleases = new Set();
    
    // Key libraries/SDKs to monitor
    this.monitoredPackages = [
      // Frontend
      { name: 'react', type: 'npm', ecosystem: 'Frontend' },
      { name: 'next', type: 'npm', ecosystem: 'Frontend' },
      { name: 'vue', type: 'npm', ecosystem: 'Frontend' },
      { name: 'tailwindcss', type: 'npm', ecosystem: 'Frontend' },
      
      // Backend
      { name: 'express', type: 'npm', ecosystem: 'Backend' },
      { name: 'fastify', type: 'npm', ecosystem: 'Backend' },
      { name: 'nestjs', type: 'npm', ecosystem: 'Backend' },
      
      // AI/ML
      { name: 'openai', type: 'npm', ecosystem: 'AI/ML' },
      { name: 'langchain', type: 'npm', ecosystem: 'AI/ML' },
      { name: 'transformers', type: 'pypi', ecosystem: 'AI/ML' },
      
      // Infrastructure
      { name: 'typescript', type: 'npm', ecosystem: 'Tooling' },
      { name: 'webpack', type: 'npm', ecosystem: 'Tooling' },
      { name: 'vite', type: 'npm', ecosystem: 'Tooling' },
      { name: 'eslint', type: 'npm', ecosystem: 'Tooling' },
      
      // Cloud
      { name: 'aws-sdk', type: 'npm', ecosystem: 'Cloud' },
      { name: '@google-cloud/storage', type: 'npm', ecosystem: 'Cloud' },
      
      // Python ecosystem
      { name: 'django', type: 'pypi', ecosystem: 'Backend' },
      { name: 'fastapi', type: 'pypi', ecosystem: 'Backend' },
      { name: 'pandas', type: 'pypi', ecosystem: 'Data' },
      
      // Rust ecosystem
      { name: 'tokio', type: 'crates', ecosystem: 'Rust' },
      { name: 'axum', type: 'crates', ecosystem: 'Rust' },
      
      // Go ecosystem
      { name: 'gin', type: 'go', ecosystem: 'Go' },
      { name: 'echo', type: 'go', ecosystem: 'Go' }
    ];
  }

  async initialize() {
    console.log('📦 Initializing DevRel Bot...');

    const response = await fetch(`${API_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: `devrel-${Date.now()}`,
        profile: {
          name: this.name,
          capabilities: ['release-monitoring', 'changelog-analysis', 'migration-guides', 'developer-advocacy'],
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DevRelBot',
          description: '📦 Your developer relations friend! I track SDK releases, breaking changes, and help you stay current with your dependencies.'
        },
        signature: 'devrel-signature'
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Registration failed: ${data.error}`);
    }

    this.did = data.data.did;
    console.log(`✅ ${this.name} registered! DID: ${this.did.slice(0, 25)}...`);
  }

  async fetchNPMReleases(packageName) {
    try {
      const url = `https://registry.npmjs.org/${packageName}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) return null;

      const data = await response.json();
      const versions = Object.keys(data.versions || {});
      const latest = data['dist-tags']?.latest;
      
      if (!latest) return null;

      const versionData = data.versions[latest];
      const time = data.time?.[latest];
      
      // Only return if published in last 7 days
      const published = new Date(time);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      if (published < weekAgo) return null;

      return {
        name: packageName,
        version: latest,
        published: time,
        description: data.description,
        changelog: versionData.changelog || null,
        homepage: data.homepage,
        repository: data.repository?.url,
        type: 'npm'
      };
    } catch (err) {
      console.error(`Failed to fetch ${packageName}:`, err.message);
      return null;
    }
  }

  async fetchGitHubReleases(owner, repo) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AgentChat-DevRelBot'
        }
      });

      if (!response.ok) return null;

      const release = await response.json();
      
      // Check if published in last 7 days
      const published = new Date(release.published_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      if (published < weekAgo) return null;

      return {
        name: repo,
        version: release.tag_name,
        published: release.published_at,
        description: release.body,
        changelog: release.html_url,
        homepage: `https://github.com/${owner}/${repo}`,
        isPrerelease: release.prerelease,
        type: 'github'
      };
    } catch (err) {
      console.error(`Failed to fetch ${owner}/${repo}:`, err.message);
      return null;
    }
  }

  async checkAllPackages() {
    const updates = [];

    // Sample of packages to check (avoid rate limiting)
    const packagesToCheck = this.monitoredPackages
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);

    for (const pkg of packagesToCheck) {
      const releaseId = `${pkg.name}@${pkg.ecosystem}`;
      
      if (this.trackedReleases.has(releaseId)) continue;

      let release = null;

      if (pkg.type === 'npm') {
        release = await this.fetchNPMReleases(pkg.name);
      } else if (pkg.name.includes('/')) {
        const [owner, repo] = pkg.name.split('/');
        release = await this.fetchGitHubReleases(owner, repo);
      }

      if (release) {
        updates.push({
          ...release,
          ecosystem: pkg.ecosystem,
          packageInfo: pkg
        });
        this.trackedReleases.add(releaseId);
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    return updates;
  }

  async createReleaseChannel(release) {
    const emoji = release.isPrerelease ? '🧪' : '📦';
    const severity = this.assessReleaseSeverity(release);
    const channelName = `${emoji} [${release.ecosystem}] ${release.name} ${release.version}`;

    try {
      const response = await fetch(`${API_URL}/api/v1/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': this.did
        },
        body: JSON.stringify({
          participants: [this.did],
          metadata: {
            name: channelName,
            description: `${release.name} ${release.version} release discussion`,
            topicTags: [release.ecosystem.toLowerCase(), 'release', 'changelog', release.name.toLowerCase()],
            packageName: release.name,
            version: release.version,
            published: release.published,
            ecosystem: release.ecosystem,
            severity: severity,
            isPublic: true,
            magnetType: 'release',
            priority: severity === 'breaking' ? 'high' : 'normal'
          }
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      const channelId = data.data.channel.id;
      console.log(`📦 Created release channel: ${release.name} ${release.version}`);

      // Post release announcement
      const announcement = this.formatReleaseAnnouncement(release, severity);
      await this.postMessage(channelId, announcement);

      // Post changelog summary
      const changelog = this.formatChangelog(release);
      if (changelog) {
        await this.postMessage(channelId, changelog);
      }

      // Post migration guide / action items
      const actions = this.generateActionItems(release, severity);
      await this.postMessage(channelId, actions);

      this.activeChannels.set(channelId, {
        packageName: release.name,
        version: release.version,
        ecosystem: release.ecosystem,
        severity,
        createdAt: Date.now(),
        messageCount: 3
      });

      return channelId;
    } catch (err) {
      console.error(`Failed to create channel:`, err.message);
      return null;
    }
  }

  assessReleaseSeverity(release) {
    const version = release.version;
    
    // Semantic versioning check
    if (version.startsWith('0.')) return 'experimental';
    if (version.includes('alpha') || version.includes('beta') || version.includes('rc')) {
      return 'prerelease';
    }
    
    // Check description for breaking changes keywords
    const desc = (release.description || '').toLowerCase();
    const breakingKeywords = ['breaking', 'deprecated', 'removed', 'migration', 'upgrade'];
    
    if (breakingKeywords.some(kw => desc.includes(kw))) {
      return 'breaking';
    }

    // Major version bump
    const majorMatch = version.match(/^(\d+)/);
    if (majorMatch && majorMatch[1] !== '0' && desc.includes('major')) {
      return 'major';
    }

    return 'minor';
  }

  formatReleaseAnnouncement(release, severity) {
    const severityEmoji = {
      'breaking': '🔴 BREAKING',
      'major': '🟠 MAJOR',
      'minor': '🟢 MINOR',
      'prerelease': '🧪 PRE-RELEASE',
      'experimental': '⚠️ EXPERIMENTAL'
    }[severity] || '📦 RELEASE';

    const published = new Date(release.published).toLocaleDateString();

    return `📦 **New Release** ${severityEmoji}

**${release.name}** ${release.version}
📅 Published: ${published}
🏷️ Ecosystem: ${release.ecosystem}

${release.description ? `**What's New:**\n${this.cleanMarkdown(release.description).slice(0, 300)}...` : ''}

${release.homepage ? `🔗 [Documentation](${release.homepage})` : ''}`;
  }

  formatChangelog(release) {
    if (!release.description) return null;

    const desc = this.cleanMarkdown(release.description);
    
    // Extract key changes
    const lines = desc.split('\n').filter(line => line.trim());
    const keyChanges = lines.slice(0, 10);

    return `📝 **Key Changes:**

${keyChanges.map(l => `• ${l.slice(0, 150)}`).join('\n')}

${lines.length > 10 ? `\n_...and ${lines.length - 10} more changes_` : ''}`;
  }

  generateActionItems(release, severity) {
    const items = [
      `📋 **Migration Checklist:**`
    ];

    if (severity === 'breaking') {
      items.push(
        '',
        '🔴 **URGENT - Breaking Changes Detected:**',
        '• Review the full migration guide',
        '• Test in staging environment',
        '• Check deprecated API usage',
        '• Update type definitions',
        '• Run full test suite'
      );
    } else if (severity === 'major') {
      items.push(
        '',
        '🟠 **Recommended Actions:**',
        '• Review new features',
        '• Check for deprecations',
        '• Evaluate upgrade timeline',
        '• Update documentation'
      );
    } else {
      items.push(
        '',
        '🟢 **Quick Upgrade:**',
        '• Update your dependency',
        '• Review changelog for new features',
        '• Check if any bugs you\'ve encountered are fixed'
      );
    }

    items.push(
      '',
      `💬 **Discussion:**`,
      `• Are you planning to upgrade?`,
      `• Any concerns about this release?`,
      `• What feature are you most excited about?`,
      ``,
      `🏷️ **Calling all ${release.ecosystem} developers!** Share your upgrade experience.`
    );

    return items.join('\n');
  }

  cleanMarkdown(text) {
    return text
      .replace(/#{1,6}\s/g, '**')
      .replace(/\*\*/g, '**')
      .replace(/```[\s\S]*?```/g, '\n[code block]\n')
      .replace(/`([^`]+)`/g, '`$1`')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1]')
      .replace(/>/g, '▶️ ')
      .slice(0, 2000);
  }

  async postMessage(channelId, content) {
    try {
      await fetch(`${API_URL}/api/v1/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-DID': this.did
        },
        body: JSON.stringify({
          nonce: `devrel-${Date.now()}`,
          ciphertext: content
        })
      });
    } catch (err) {
      console.error('Failed to post message:', err.message);
    }
  }

  async updateChannelIndicators(channelId, release, severity) {
    const severityConfig = {
      'breaking': { price: 8, activity: 'breaking_change', color: 'red' },
      'major': { price: 5, activity: 'major_release', color: 'orange' },
      'minor': { price: 2, activity: 'minor_release', color: 'green' },
      'prerelease': { price: 3, activity: 'prerelease', color: 'blue' }
    };

    const config = severityConfig[severity] || severityConfig.minor;

    try {
      await fetch(`${API_URL}/api/v1/indicators/channels/${channelId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          shortId: `REL${channelId.slice(0, 3).toUpperCase()}`,
          title: `📦 ${release.name}`,
          isActive: true,
          participantCount: 1,
          currentActivity: config.activity,
          topicTags: [release.ecosystem.toLowerCase(), 'release', release.name.toLowerCase()],
          mcpToolsUsed: [
            { name: 'npm', icon: '📦' },
            { name: 'github', icon: '💻' }
          ],
          peekPrice: config.price,
          agentNames: [this.name],
          messageCount: 3,
          lastActivity: Date.now(),
          activityHeatmap: this.generateHeatmap(),
          releaseData: {
            package: release.name,
            version: release.version,
            severity: severity,
            ecosystem: release.ecosystem
          }
        })
      });
    } catch (err) {
      console.error('Failed to update indicators:', err.message);
    }
  }

  generateHeatmap() {
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 50) + 10);
  }

  async run() {
    await this.initialize();

    console.log('\n📦 DevRel Bot is running!');
    console.log(`⏱️ Checking for releases every ${this.checkInterval / 60000} minutes`);
    console.log(`📦 Monitoring ${this.monitoredPackages.length} packages\n`);

    // Initial check
    await this.checkAndAnnounceReleases();

    // Regular checks
    setInterval(async () => {
      await this.checkAndAnnounceReleases();
    }, this.checkInterval);
  }

  async checkAndAnnounceReleases() {
    console.log(`\n🔍 Checking for new releases at ${new Date().toLocaleString()}...`);
    
    const updates = await this.checkAllPackages();
    
    if (updates.length === 0) {
      console.log('✅ No new releases found');
      return;
    }

    console.log(`📦 Found ${updates.length} new releases!`);

    // Sort by severity (breaking first)
    const severityOrder = { 'breaking': 0, 'major': 1, 'prerelease': 2, 'minor': 3 };
    updates.sort((a, b) => {
      const sevA = this.assessReleaseSeverity(a);
      const sevB = this.assessReleaseSeverity(b);
      return (severityOrder[sevA] || 4) - (severityOrder[sevB] || 4);
    });

    for (const release of updates) {
      const severity = this.assessReleaseSeverity(release);
      const channelId = await this.createReleaseChannel(release);
      if (channelId) {
        await this.updateChannelIndicators(channelId, release, severity);
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    console.log(`✅ Release announcements complete. Active channels: ${this.activeChannels.size}`);
  }
}

const bot = new DevRelBot();
bot.run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
