# Home-App Deployment & Security Guide

This guide provides detailed security analysis and implementation plans for deploying your Home-App and PocketBase using Cloudflare.

---

## 🎯 Quick Recommendation

**For personal/home use on Steam Deck**: **Cloudflare Tunnel (Option 1)**
- Zero cost
- No exposed ports
- Automatic security updates
- Works from dynamic IP
- Perfect for always-on home device

**For professional/production use**: **VPS Hosting (Option 2)**
- Better control
- More flexible
- Industry standard
- Easier debugging

---

## Option 1: Cloudflare Tunnel (Zero Trust Network Access)

### 📋 Detailed Implementation Plan

#### Phase 1: Initial Setup
```bash
# 1. Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
sudo mv cloudflared /usr/local/bin/
sudo chmod +x /usr/local/bin/cloudflared

# 2. Authenticate with Cloudflare
cloudflared tunnel login
# This opens browser to authorize - you'll get a cert file

# 3. Create tunnel
cloudflared tunnel create home-app
# Save the tunnel ID shown in output
```

#### Phase 2: Configuration
```yaml
# ~/.cloudflared/config.yml
tunnel: <your-tunnel-id>
credentials-file: /home/deck/.cloudflared/<tunnel-id>.json

ingress:
  # Home-App Frontend
  - hostname: app.yourdomain.com
    service: http://localhost:5173
    originRequest:
      noTLSVerify: false
      
  # PocketBase API
  - hostname: api.yourdomain.com
    service: http://localhost:8090
    originRequest:
      noTLSVerify: false
      
  # Catch-all rule (required)
  - service: http_status:404
```

#### Phase 3: DNS Routing
```bash
# Route subdomains through tunnel
cloudflared tunnel route dns home-app app.yourdomain.com
cloudflared tunnel route dns home-app api.yourdomain.com
```

#### Phase 4: Systemd Service
```ini
# /etc/systemd/system/cloudflared.service
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=deck
ExecStart=/usr/local/bin/cloudflared tunnel run home-app
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

### ✅ Pros

| Advantage | Details |
|-----------|---------|
| **Zero Port Forwarding** | No need to open firewall ports - more secure by default |
| **Dynamic IP Friendly** | Works even if your ISP changes your IP address |
| **Free SSL/TLS** | Automatic HTTPS with Cloudflare certificates |
| **DDoS Protection** | Cloudflare's network absorbs attacks before they reach you |
| **No Static IP Needed** | Perfect for home internet connections |
| **Easy Setup** | Minimal configuration required |
| **Automatic Failover** | Tunnel auto-reconnects if connection drops |
| **Built for Steam Deck** | Perfect for always-on home devices |

---

### ❌ Cons

| Disadvantage | Details |
|--------------|---------|
| **Cloudflare Dependency** | Service unavailable if Cloudflare has issues |
| **Limited Control** | Can't customize reverse proxy as much as nginx |
| **Tunnel Overhead** | Slight latency increase (usually <50ms) |
| **Cloudflare ToS** | Must comply with their terms of service |
| **Debugging Complexity** | Harder to troubleshoot connection issues |
| **Rate Limiting** | Subject to Cloudflare's free tier limits |

---

### 🔒 Security Configuration for Option 1

#### 1. Cloudflare Access (Zero Trust)
```yaml
# Enhanced config with access control
tunnel: <your-tunnel-id>
credentials-file: /home/deck/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:5173
    originRequest:
      noTLSVerify: false
      connectTimeout: 30s
      
  - hostname: api.yourdomain.com
    service: http://localhost:8090
    originRequest:
      noTLSVerify: false
      connectTimeout: 30s
```

**Add Cloudflare Access (Zero Trust):**
1. Go to Cloudflare Dashboard → Zero Trust → Access → Applications
2. Add Application → Self-hosted
3. Configure:
   - **Application domain**: `app.yourdomain.com`
   - **Type**: Self-hosted
   - **Session duration**: 24 hours
4. Add Policy:
   - **Name**: "Home Access"
   - **Action**: Allow
   - **Include**: Emails ending in `@youremail.com` (or specific emails)
   - Or use One-Time PIN for any email

**Benefits:**
- Additional authentication layer BEFORE reaching your app
- Can use email verification, Google OAuth, GitHub, etc.
- Free for up to 50 users
- Protects against unauthorized access even if app has vulnerabilities

#### 2. PocketBase Security Hardening

Create `/home/deck/Workspaces/personal/Home-App/pb_hooks/config.pb.js`:
```javascript
// Rate limiting and security headers
onBeforeServe((e) => {
    e.router.use((c) => {
        const res = c.response()
        
        // Security headers
        res.header().set('X-Content-Type-Options', 'nosniff')
        res.header().set('X-Frame-Options', 'DENY')
        res.header().set('X-XSS-Protection', '1; mode=block')
        res.header().set('Referrer-Policy', 'strict-origin-when-cross-origin')
        res.header().set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
        
        // Strict CORS - only allow your frontend
        res.header().set('Access-Control-Allow-Origin', 'https://app.yourdomain.com')
        res.header().set('Access-Control-Allow-Credentials', 'true')
        
        return c.next()
    })
})
```

**PocketBase Admin Panel Protection:**
```bash
# Set admin email and strong password during first setup
# Access admin at: https://api.yourdomain.com/_/
```

**Environment Configuration:**
```env
# .env.production
VITE_POCKETBASE_URL=https://api.yourdomain.com
```

#### 3. Firewall Configuration (Local)
```bash
# Only allow localhost connections to PocketBase
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh  # If you need SSH
sudo ufw enable

# PocketBase and frontend are NOT exposed directly
# Only cloudflared can access them (localhost only)
```

#### 4. Application-Level Security

**Update PocketBase Settings** (via Admin UI):
1. **Settings → Application**:
   - Enable "Hide collections" (only show to authenticated users)
   
2. **Settings → Mail**:
   - Configure SMTP for password resets
   - Use application-specific password for Gmail/etc.

3. **Settings → Logs**:
   - Enable request logging
   - Set retention to 7-14 days

**Collection Security Rules** (already have auth, but review):
```javascript
// Example for sensitive collections
// Only authenticated users can read their own data
@request.auth.id != "" && @request.auth.id = user_id
```

#### 5. Monitoring & Logging
```bash
# Monitor cloudflared logs
sudo journalctl -u cloudflared -f

# Monitor PocketBase logs (if running as service)
sudo journalctl -u pocketbase -f

# Monitor frontend
sudo journalctl -u home-app-frontend -f
```

#### 6. Cloudflare WAF Rules (Free Tier)
In Cloudflare Dashboard → Security → WAF:
1. Enable "Browser Integrity Check"
2. Enable "Bot Fight Mode" (free tier)
3. Set Security Level to "Medium" or "High"
4. Add custom rules:
   ```
   Block if:
   - Country NOT IN [Your Country]  (if you only access from one place)
   - Known bots
   - Threat Score > 50
   ```

#### 7. Backup Strategy
```bash
#!/bin/bash
# ~/backup-pocketbase.sh
BACKUP_DIR="/home/deck/backups/pocketbase"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PocketBase data
cp -r /home/deck/Workspaces/personal/Home-App/pb_data $BACKUP_DIR/pb_data_$DATE

# Keep only last 7 backups
ls -t $BACKUP_DIR | tail -n +8 | xargs -I {} rm -rf $BACKUP_DIR/{}
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /home/deck/backup-pocketbase.sh
```

#### 8. Update Strategy
```bash
# Create update script: ~/update-home-app.sh
#!/bin/bash
set -e

cd /home/deck/Workspaces/personal/Home-App

# Backup first
~/backup-pocketbase.sh

# Update dependencies
npm update

# Rebuild
npm run build

# Restart services
sudo systemctl restart home-app-frontend
sudo systemctl restart pocketbase  # if you have pocketbase service

echo "Update complete!"
```

---

## Option 2: VPS Hosting with Reverse Proxy

### 📋 Detailed Implementation Plan

#### Phase 1: VPS Setup
```bash
# Choose a provider:
# - Hetzner Cloud (€4.15/month - 2GB RAM, 40GB SSD)
# - DigitalOcean ($6/month - 1GB RAM, 25GB SSD)
# - Linode ($5/month - 1GB RAM, 25GB SSD)
# - Oracle Free Tier (FREE - 1GB RAM ARM or limited x86)

# Initial server setup (Ubuntu 22.04 LTS)
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser deck
usermod -aG sudo deck
```

#### Phase 2: Security Hardening
```bash
# Configure SSH
nano /etc/ssh/sshd_config
```

```ini
# /etc/ssh/sshd_config - Security settings
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222  # Non-standard port reduces bot attacks
X11Forwarding no
```

```bash
# Copy your SSH key before disabling password auth!
ssh-copy-id -p 2222 deck@your-vps-ip

# Restart SSH
systemctl restart sshd

# Setup firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 2222/tcp  # SSH
ufw allow 80/tcp    # HTTP (Cloudflare)
ufw allow 443/tcp   # HTTPS (Cloudflare)
ufw enable
```

#### Phase 3: Install Dependencies
```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install nginx
apt install -y nginx

# Install fail2ban (brute force protection)
apt install -y fail2ban

# Configure fail2ban
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 2222
EOF

systemctl enable fail2ban
systemctl start fail2ban
```

#### Phase 4: Deploy Application
```bash
# Clone your repo
cd /var/www
git clone https://github.com/yourusername/Home-App.git
cd Home-App

# Install dependencies
npm install

# Create production .env
cat > .env <<EOF
VITE_POCKETBASE_URL=https://api.yourdomain.com
EOF

# Build frontend
npm run build

# Download PocketBase
cd /opt
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip
unzip pocketbase_0.22.0_linux_amd64.zip
chmod +x pocketbase
```

#### Phase 5: Nginx Configuration
```nginx
# /etc/nginx/sites-available/home-app

# Frontend
server {
    listen 80;
    server_name app.yourdomain.com;
    
    # Cloudflare real IP
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    real_ip_header CF-Connecting-IP;
    
    root /var/www/Home-App/dist;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# PocketBase API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Cloudflare real IP (same as above)
    set_real_ip_from 173.245.48.0/20;
    # ... (include all Cloudflare IPs)
    real_ip_header CF-Connecting-IP;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
    
    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        
        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        
        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (for PocketBase realtime)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Block admin panel from public (optional)
    location /_/ {
        allow YOUR_HOME_IP;  # Replace with your IP
        deny all;
        proxy_pass http://localhost:8090;
    }
}
```

```bash
# Enable sites
ln -s /etc/nginx/sites-available/home-app /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### Phase 6: Systemd Services
```ini
# /etc/systemd/system/pocketbase.service
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http=127.0.0.1:8090
Restart=on-failure
RestartSec=5

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/pocketbase/pb_data

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable pocketbase
systemctl start pocketbase
```

#### Phase 7: Cloudflare DNS Configuration
1. Go to Cloudflare DNS settings
2. Add A records:
   - `app.yourdomain.com` → `your-vps-ip` (Proxied ✅)
   - `api.yourdomain.com` → `your-vps-ip` (Proxied ✅)
3. SSL/TLS mode: **Full (strict)** after getting Let's Encrypt cert

#### Phase 8: SSL Certificate (Let's Encrypt)
```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Get certificates
certbot --nginx -d app.yourdomain.com -d api.yourdomain.com

# Auto-renewal (certbot creates this automatically)
systemctl status certbot.timer
```

---

### ✅ Pros

| Advantage | Details |
|-----------|---------|
| **Full Control** | Complete control over server configuration |
| **No Cloudflare Dependency** | Server works even if Cloudflare has issues |
| **Industry Standard** | nginx + VPS is battle-tested architecture |
| **Easier Debugging** | Direct access to all logs and configurations |
| **Flexible** | Can run additional services easily |
| **Performance** | No tunnel overhead, direct connection |
| **SSH Access** | Full terminal access for troubleshooting |

---

### ❌ Cons

| Disadvantage | Details |
|--------------|---------|
| **Cost** | $5-6/month minimum (vs free tunnel) |
| **Maintenance** | Responsible for OS updates, security patches |
| **Exposed Ports** | Ports 80/443 are public (but protected by firewall) |
| **Static IP Required** | Need consistent VPS IP address |
| **Setup Complexity** | More configuration required |
| **DDoS Vulnerability** | More exposed without Cloudflare tunnel protection |
| **Responsibility** | You manage security updates |

---

### 🔒 Security Configuration for Option 2

#### 1. Advanced Firewall Rules (UFW)
```bash
# Rate limiting for HTTP/HTTPS
ufw limit 80/tcp
ufw limit 443/tcp

# Log blocked attempts
ufw logging on

# Allow only Cloudflare IPs (maximum security)
# This ensures ONLY Cloudflare can reach your server
ufw delete allow 80/tcp
ufw delete allow 443/tcp

# Add Cloudflare IP ranges
for ip in $(curl https://www.cloudflare.com/ips-v4); do
    ufw allow from $ip to any port 80 proto tcp
    ufw allow from $ip to any port 443 proto tcp
done
```

#### 2. Intrusion Detection (AIDE)
```bash
# Install AIDE
apt install -y aide

# Initialize database
aideinit

# Check for changes daily
cat > /etc/cron.daily/aide-check <<'EOF'
#!/bin/bash
/usr/bin/aide --check | mail -s "AIDE Report $(hostname)" your@email.com
EOF

chmod +x /etc/cron.daily/aide-check
```

#### 3. Automatic Security Updates
```bash
# Install unattended-upgrades
apt install -y unattended-upgrades

# Configure
cat > /etc/apt/apt.conf.d/50unattended-upgrades <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
};
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "your@email.com";
EOF

# Enable
dpkg-reconfigure -plow unattended-upgrades
```

#### 4. PocketBase Security (Same as Option 1)
- Use pb_hooks for security headers
- Restrict admin panel by IP
- Enable CORS only for your domain
- Use strong admin password
- Enable 2FA for admin (if available in future versions)

#### 5. Nginx Security Enhancements
```nginx
# /etc/nginx/nginx.conf - Add to http block
http {
    # Hide nginx version
    server_tokens off;
    
    # Buffer overflow protection
    client_body_buffer_size 1K;
    client_header_buffer_size 1k;
    client_max_body_size 10M;  # Adjust for file uploads
    large_client_header_buffers 2 1k;
    
    # Timeouts
    client_body_timeout 10;
    client_header_timeout 10;
    keepalive_timeout 5 5;
    send_timeout 10;
    
    # SSL Configuration (after certbot)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers (global)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

#### 6. Monitoring Setup
```bash
# Install monitoring tools
apt install -y htop iotop nethogs

# Install logwatch for daily reports
apt install -y logwatch
logwatch --output mail --mailto your@email.com --detail high

# Monitor disk space
cat > /etc/cron.daily/disk-check <<'EOF'
#!/bin/bash
THRESHOLD=80
USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt $THRESHOLD ]; then
    echo "Disk usage is at ${USAGE}%" | mail -s "Disk Alert $(hostname)" your@email.com
fi
EOF

chmod +x /etc/cron.daily/disk-check
```

#### 7. Database Backup (Automated)
```bash
# Create backup script
cat > /opt/backup-script.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup PocketBase
tar -czf $BACKUP_DIR/pocketbase_$DATE.tar.gz /opt/pocketbase/pb_data

# Backup to external service (optional)
# rclone copy $BACKUP_DIR/pocketbase_$DATE.tar.gz remote:backups/

# Keep only last 14 backups
ls -t $BACKUP_DIR | tail -n +15 | xargs -I {} rm $BACKUP_DIR/{}
EOF

chmod +x /opt/backup-script.sh

# Add to crontab
crontab -e
# Add: 0 3 * * * /opt/backup-script.sh
```

#### 8. Cloudflare WAF (Same as Option 1)
- Enable Bot Fight Mode
- Set Security Level to High
- Add geo-blocking rules
- Enable Browser Integrity Check

#### 9. SSH Hardening (Additional)
```bash
# Install and configure 2FA for SSH
apt install -y libpam-google-authenticator

# Configure for your user
su - deck
google-authenticator
# Follow prompts: Yes, Yes, Yes, No, Yes

# Update PAM
echo "auth required pam_google_authenticator.so" >> /etc/pam.d/sshd

# Update SSH config
nano /etc/ssh/sshd_config
# Add: ChallengeResponseAuthentication yes

systemctl restart sshd
```

---

## 🔐 Security Checklist (Both Options)

### Application Level
- [ ] Strong PocketBase admin password (16+ characters, random)
- [ ] Environment variables for all secrets
- [ ] CORS restricted to your domain only
- [ ] Collection security rules reviewed
- [ ] File upload restrictions configured
- [ ] Rate limiting enabled
- [ ] Input validation on all forms
- [ ] SQL injection protection (PocketBase handles this)
- [ ] XSS protection headers enabled

### Network Level
- [ ] HTTPS enforced on all connections
- [ ] TLS 1.2+ only
- [ ] Firewall configured (local or VPS)
- [ ] DDoS protection enabled (Cloudflare)
- [ ] Bot protection enabled
- [ ] Geo-blocking configured (if needed)

### Infrastructure Level
- [ ] Regular backups automated (daily minimum)
- [ ] Backup restoration tested
- [ ] Security updates automated
- [ ] Monitoring and alerts configured
- [ ] Logs retention configured (7-14 days)
- [ ] Intrusion detection enabled (VPS only)

### Access Control
- [ ] No root login (VPS only)
- [ ] SSH key authentication only (VPS only)
- [ ] 2FA enabled where possible
- [ ] Cloudflare Access configured (optional but recommended)
- [ ] Admin panel IP-restricted (optional)

### Operational
- [ ] Update procedure documented
- [ ] Rollback procedure tested
- [ ] Incident response plan created
- [ ] Contact information for emergencies
- [ ] Regular security audits scheduled (quarterly)

---

## 📊 Cost Comparison

| Item | Option 1 (Tunnel) | Option 2 (VPS) |
|------|-------------------|----------------|
| Cloudflare | Free | Free |
| Tunnel/VPS | Free | $5-6/month |
| SSL Certificate | Free | Free (Let's Encrypt) |
| Domain | ~$12/year | ~$12/year |
| **Total Monthly** | **$0** | **$5-6** |
| **Total Yearly** | **$12** | **$72-84** |

---

## 🎯 Final Recommendation Matrix

| Use Case | Best Option | Reason |
|----------|-------------|---------|
| **Personal use, Steam Deck** | Option 1 (Tunnel) | Free, zero maintenance, perfect for home device |
| **Professional portfolio** | Option 2 (VPS) | More credible, full control |
| **Learning DevOps** | Option 2 (VPS) | Hands-on server management experience |
| **Budget-conscious** | Option 1 (Tunnel) | Completely free |
| **Maximum security** | Option 1 + Cloudflare Access | Additional auth layer free |
| **Testing/Development** | Option 1 (Tunnel) | Quick setup, no cost |
| **Production app with users** | Option 2 (VPS) | Better reliability and control |

---

## 🚀 Next Steps

### To Proceed with Option 1 (Cloudflare Tunnel):
1. Review the security configuration section
2. Decide if you want Cloudflare Access (recommended)
3. Let me know and I can help set up the tunnel configuration files
4. I'll create systemd service files for cloudflared

### To Proceed with Option 2 (VPS Hosting):
1. Choose a VPS provider (I recommend Hetzner for best value)
2. Spin up an Ubuntu 22.04 LTS server
3. Let me know and I can help create deployment scripts
4. I'll create nginx configs and systemd services

### Want Both for Redundancy?
You can actually run both! Use Option 1 as primary, Option 2 as backup:
- Primary: `app.yourdomain.com` → Cloudflare Tunnel (Steam Deck)
- Backup: `vps.yourdomain.com` → VPS (in case Steam Deck is off)

**What would you like to proceed with?**
