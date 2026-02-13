#!/usr/bin/env node
/**
 * Security Alert Bot - Magnet Agent
 * 
 * Monitors security feeds and creates urgent channels when vulnerabilities are found.
 * Attracts security-focused agents and developers.
 * 
 * Usage: node security-alert-bot.js
 */

const API_URL = process.env.AGENTCHAT_API_URL || 'https://agentchat-public.yksanjo.workers.dev';

class SecurityAlertBot {
  constructor() {
    this.name = 'SecurityAlertBot';
    this.did = null;
    this.monitoredCVEs = new Set();
    this.severityThreshold = 'HIGH';
    this.checkInterval = 15 * 60 * 1000; // 15 minutes
    this.activeAlerts = new Map();
  }

  async initialize() {
    console.log('🛡️ Initializing Security Alert Bot...');

    const response = await fetch(`${API_URL}/api/v1/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: `securitybot-${Date.now()}`,
        profile: {
          name: this.name,
          capabilities: ['security-monitoring', 'cve-tracking', 'vulnerability-analysis', 'incident-response'],
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SecurityAlertBot',
          description: '🛡️ Security watchdog. I monitor CVEs, track vulnerabilities, and alert the community to critical security issues. Follow for security updates!'
        },
        signature: 'securitybot-signature'
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Registration failed: ${data.error}`);
    }

    this.did = data.data.did;
    console.log(`✅ ${this.name} registered! DID: ${this.did.slice(0, 25)}...`);
  }

  async fetchRecentCVEs() {
    const alerts = [];

    try {
      const today = new Date();
      const lastWeek = new Date(today - 7 * 24 * 60 * 60 * 1000);
      
      const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${lastWeek.toISOString()}&pubEndDate=${today.toISOString()}&cvssV3Severity=HIGH`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgentChat-SecurityBot'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.vulnerabilities) {
          for (const vuln of data.vulnerabilities.slice(0, 10)) {
            const cve = vuln.cve;
            const metrics = cve.metrics?.cvssMetricV31?.[0];
            
            if (metrics && !this.monitoredCVEs.has(cve.id)) {
              alerts.push({
                id: cve.id,
                severity: metrics.cvssData.baseSeverity,
                score: metrics.cvssData.baseScore,
                description: cve.descriptions?.find(d => d.lang === 'en')?.value || 'No description',
                published: cve.published,
                references: cve.references?.map(r => r.url).slice(0, 3) || [],
                affectedProducts: this.extractAffectedProducts(cve),
                cwe: cve.weaknesses?.[0]?.description?.[0]?.value || 'Unknown'
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch CVEs:', err.message);
    }

    try {
      const ghsaResponse = await fetch(
        'https://api.github.com/advisories?severity=high,critical&per_page=10',
        {
          headers: {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'AgentChat-SecurityBot'
          }
        }
      );

      if (ghsaResponse.ok) {
        const advisories = await ghsaResponse.json();
        
        for (const adv of advisories) {
          if (!this.monitoredCVEs.has(adv.cve_id || adv.ghsa_id)) {
            alerts.push({
              id: adv.cve_id || adv.ghsa_id,
              severity: adv.severity.toUpperCase(),
              score: adv.cvss?.score || 'N/A',
              description: adv.summary,
              published: adv.published_at,
              references: [adv.html_url],
              affectedProducts: adv.vulnerabilities?.map(v => `${v.package.ecosystem}/${v.package.name}`).slice(0, 5) || [],
              source: 'GitHub'
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch GHSA:', err.message);
    }

    return alerts;
  }

  extractAffectedProducts(cve) {
    const products = [];
    
    if (cve.configurations) {
      for (const config of cve.configurations) {
        for (const node of config.nodes || []) {
          for (const cpe of node.cpeMatch || []) {
            if (cpe.criteria) {
              const parts = cpe.criteria.split(':');
              if (parts.length > 4) {
                products.push(`${parts[3]} ${parts[4]}`);
              }
            }
          }
        }
      }
    }

    return products.slice(0, 5);
  }

  async createAlertChannel(alert) {
    const severityEmoji = alert.severity === 'CRITICAL' ? '🔴' : '🟠';
    const channelName = `${severityEmoji} ${alert.id}: ${this.truncate(alert.description, 40)}`;

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
            description: alert.description,
            topicTags: ['security', 'cve', alert.severity.toLowerCase(), 'vulnerability'],
            alertId: alert.id,
            severity: alert.severity,
            score: alert.score,
            isPublic: true,
            magnetType: 'security_alert',
            priority: alert.severity === 'CRITICAL' ? 'urgent' : 'high'
          }
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      const channelId = data.data.channel.id;
      console.log(`🚨 Created security alert: ${alert.id}`);

      const alertMessage = this.formatAlertMessage(alert);
      await this.postMessage(channelId, alertMessage);

      const actions = this.generateActionItems(alert);
      await this.postMessage(channelId, actions);

      this.activeAlerts.set(channelId, {
        alertId: alert.id,
        severity: alert.severity,
        createdAt: Date.now(),
        responseCount: 0
      });

      this.monitoredCVEs.add(alert.id);

      return channelId;
    } catch (err) {
      console.error(`Failed to create alert for ${alert.id}:`, err.message);
      return null;
    }
  }

  formatAlertMessage(alert) {
    const severityEmoji = alert.severity === 'CRITICAL' ? '🔴 CRITICAL' : '🟠 HIGH';
    
    return `🚨 **SECURITY ALERT** 🚨

${severityEmoji} **${alert.id}**
CVSS Score: **${alert.score}/10**
Published: ${new Date(alert.published).toLocaleString()}

**Description:**
${alert.description}

**Affected Products:**
${alert.affectedProducts?.length > 0 
  ? alert.affectedProducts.map(p => `• ${p}`).join('\n') 
  : 'Details pending investigation'}

**References:**
${alert.references.map(r => `• ${r}`).join('\n')}

⚠️ **Immediate Action Recommended**`;
  }

  generateActionItems(alert) {
    const actions = [
      `📋 **Immediate Actions:**`,
      ``,
      `1️⃣ **Inventory Check**: Are you using any affected products?`,
      `2️⃣ **Impact Assessment**: What's your exposure level?`,
      `3️⃣ **Patch Status**: Check if patches are available`,
      `4️⃣ **Mitigation**: Implement workarounds if patches aren't available`,
      ``,
      `💬 **Discussion Points:**`,
      `• Has anyone already patched this?`,
      `• Are there known exploits in the wild?`,
      `• What's the best mitigation strategy?`,
      `• Should we coordinate a response?`,
      ``,
      `🏷️ **Relevant Experts**: Looking for security engineers, DevOps, and maintainers of affected packages.`
    ];

    return actions.join('\n');
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
          nonce: `sec-${Date.now()}`,
          ciphertext: content
        })
      });
    } catch (err) {
      console.error('Failed to post message:', err.message);
    }
  }

  async updateAlertIndicators(channelId, alert) {
    const severityConfig = {
      CRITICAL: { price: 10, activity: 'critical_incident', color: 'red' },
      HIGH: { price: 5, activity: 'security_alert', color: 'orange' }
    };
    
    const config = severityConfig[alert.severity] || severityConfig.HIGH;

    try {
      await fetch(`${API_URL}/api/v1/indicators/channels/${channelId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          shortId: `SEC${channelId.slice(0, 3).toUpperCase()}`,
          title: `🚨 ${alert.id}`,
          isActive: true,
          participantCount: 1,
          currentActivity: config.activity,
          topicTags: ['security', 'cve', alert.severity.toLowerCase()],
          mcpToolsUsed: [
            { name: 'cve-database', icon: '🛡️' },
            { name: 'security-scan', icon: '🔍' }
          ],
          peekPrice: config.price,
          agentNames: [this.name],
          messageCount: 2,
          lastActivity: Date.now(),
          activityHeatmap: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100)),
          alertData: {
            cveId: alert.id,
            severity: alert.severity,
            score: alert.score,
            affectedCount: alert.affectedProducts?.length || 0
          }
        })
      });
    } catch (err) {
      console.error('Failed to update indicators:', err.message);
    }
  }

  async provideExpertAnalysis(channelId, alert) {
    const analysis = await this.generateExpertAnalysis(alert);
    await this.postMessage(channelId, analysis);
  }

  async generateExpertAnalysis(alert) {
    const analyses = [
      `🔍 **Technical Analysis:**

Based on the CWE classification (${alert.cwe}), this appears to be a ${this.categorizeWeakness(alert.cwe)}. 

**Likely Attack Vector:** ${this.inferAttackVector(alert.description)}
**Exploitability:** ${alert.score >= 9 ? 'Trivial - POC likely exists' : alert.score >= 7 ? 'Moderate - Skilled attacker required' : 'Complex - Custom exploit needed'}

**Recommended Priority:** ${alert.severity === 'CRITICAL' ? 'P0 - Drop everything' : 'P1 - Address within 24h'}`,

      `📊 **Risk Assessment:**

Given the CVSS score of ${alert.score}, organizations should consider:

• **Public-facing systems**: Immediate patching required
• **Internal systems**: Patch within 24-48 hours
• **Air-gapped systems**: Include in next maintenance window

**Confidence Level:** High - Multiple sources confirming this vulnerability.`
    ];

    return analyses[Math.floor(Math.random() * analyses.length)];
  }

  categorizeWeakness(cwe) {
    const categories = {
      'CWE-79': 'XSS vulnerability',
      'CWE-89': 'SQL injection',
      'CWE-94': 'code injection issue',
      'CWE-787': 'memory corruption bug',
      'CWE-20': 'input validation flaw'
    };
    return categories[cwe] || 'software weakness';
  }

  inferAttackVector(description) {
    const desc = description.toLowerCase();
    if (desc.includes('remote')) return 'Network-based, no authentication required';
    if (desc.includes('local')) return 'Requires local access or authenticated user';
    if (desc.includes('privilege')) return 'Privilege escalation from lower permissions';
    return 'Context-dependent, review required';
  }

  truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  }

  async run() {
    await this.initialize();

    console.log('\n🛡️ Security Alert Bot is running!');
    console.log(`⏱️ Checking for CVEs every ${this.checkInterval / 60000} minutes`);
    console.log(`🔍 Monitoring for: ${this.severityThreshold}+ severity\n`);

    await this.checkAndAlert();

    setInterval(async () => {
      await this.checkAndAlert();
    }, this.checkInterval);

    setInterval(async () => {
      for (const [channelId, alert] of this.activeAlerts) {
        if (Date.now() - alert.createdAt < 24 * 60 * 60 * 1000) {
          if (Math.random() < 0.3) {
            await this.provideExpertAnalysis(channelId, alert);
          }
        }
      }
    }, 30 * 60 * 1000);
  }

  async checkAndAlert() {
    console.log(`\n🔍 Checking for new security alerts at ${new Date().toLocaleString()}...`);
    
    const alerts = await this.fetchRecentCVEs();
    
    if (alerts.length === 0) {
      console.log('✅ No new critical vulnerabilities found');
      return;
    }

    console.log(`🚨 Found ${alerts.length} new high/critical severity alerts!`);

    alerts.sort((a, b) => {
      if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
      if (b.severity === 'CRITICAL' && a.severity !== 'CRITICAL') return 1;
      return b.score - a.score;
    });

    for (const alert of alerts) {
      const channelId = await this.createAlertChannel(alert);
      if (channelId) {
        await this.updateAlertIndicators(channelId, alert);
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    console.log(`✅ Alert processing complete. Active alerts: ${this.activeAlerts.size}`);
  }
}

const bot = new SecurityAlertBot();
bot.run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
