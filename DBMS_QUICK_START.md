# DBMS HARDENING - QUICK START GUIDE

**TL;DR**: Your database is now DBMS-solid. Use these commands to verify and manage it.

---

## 30-SECOND SETUP

```bash
cd server

# Check if database is healthy
node src/scripts/dbms-cli.js health-report
```

**Expected Output**:
```
Overall Health: HEALTHY
Integrity Score: 100%
Consistency Score: 100%
```

Done! ✅

---

## 5 ESSENTIAL COMMANDS

### 1️⃣ Check Database Health (Daily)
```bash
node src/scripts/dbms-cli.js health-report
```
**Use case**: Quick daily check  
**Expected**: "Overall Health: HEALTHY"

### 2️⃣ Detect Corruption (If issues)
```bash
node src/scripts/dbms-cli.js detect-orphans
```
**Use case**: Find broken references  
**Output**: List of corrupted records

### 3️⃣ Preview Cleanup (Safe)
```bash
node src/scripts/dbms-cli.js cleanup-dry-run
```
**Use case**: See what would be deleted  
**Output**: Deletion preview (no actual changes)

### 4️⃣ Run Cleanup (Destructive)
```bash
node src/scripts/dbms-cli.js cleanup-live
```
**Use case**: Delete orphans  
**⚠️ Warning**: Requires confirmation, deletes data

### 5️⃣ Fresh Database (Nuclear)
```bash
node src/scripts/dbms-cli.js reseed-live
```
**Use case**: Start over  
**⚠️ Warning**: Requires confirmation, clears everything

---

## QUICK WORKFLOWS

### 🚀 Normal Day
```bash
# Just check health
node src/scripts/dbms-cli.js health-report

# If healthy: ✅ Continue working
# If degraded: 👇 See next workflow
```

### 🔧 Health Degraded
```bash
# 1. Check integrity
node src/scripts/dbms-cli.js validate-integrity

# 2. Check consistency
node src/scripts/dbms-cli.js audit-consistency

# 3. Detect orphans
node src/scripts/dbms-cli.js detect-orphans

# 4. Preview cleanup
node src/scripts/dbms-cli.js cleanup-dry-run

# 5. If safe, run cleanup
node src/scripts/dbms-cli.js cleanup-live

# 6. Verify recovery
node src/scripts/dbms-cli.js health-report
```

### 🆕 Fresh Start
```bash
# Reseed entire database
node src/scripts/dbms-cli.js reseed-live

# Verify integrity
node src/scripts/dbms-cli.js health-report

# Expected: HEALTHY ✅
```

### 🔍 Complete Diagnosis
```bash
# Run all checks
node src/scripts/dbms-cli.js full-check

# This runs:
# 1. Health report
# 2. Orphan detection
# 3. Integrity validation
# 4. Consistency audit
```

---

## WHAT WAS CHANGED

### Database Layer
✅ 7 models enhanced with validation  
✅ Referential integrity enforced  
✅ Orphan prevention  
✅ Immutable audit logs  

### Tools
✅ 5 new scripts created  
✅ Master CLI tool  
✅ Health monitoring  
✅ Automated cleanup  

### Application
⚠️ **ZERO CHANGES**
- No routes changed
- No controllers changed
- No UI changed
- No APIs changed
- **Everything works exactly like before, but safer**

---

## ERROR RECOVERY

### "Unknown Student" Error
```bash
# 1. Detect orphans
node src/scripts/dbms-cli.js detect-orphans

# 2. See if that student exists
# 3. If not, cleanup orphans
node src/scripts/dbms-cli.js cleanup-live

# 4. Reseed if needed
node src/scripts/dbms-cli.js reseed-live
```

### "Unknown Book" Error
Same as above but for books.

### High Orphan Count
```bash
# 1. Backup (just in case)
# 2. Preview cleanup
node src/scripts/dbms-cli.js cleanup-dry-run

# 3. If safe, run cleanup
node src/scripts/dbms-cli.js cleanup-live

# 4. Verify
node src/scripts/dbms-cli.js health-report
```

### Low Integrity Score
```bash
# Check what's wrong
node src/scripts/dbms-cli.js validate-integrity

# See detailed issues
node src/scripts/dbms-cli.js full-check

# If corrupted, cleanup
node src/scripts/dbms-cli.js cleanup-live
```

---

## AUTOMATION (OPTIONAL)

### Daily Health Check
Add to crontab:
```bash
0 2 * * * cd /path/to/server && node src/scripts/dbms-cli.js health-report >> /var/log/db-health.log
```

### API Health Endpoint
Add to Express app:
```javascript
const { generateHealthReport } = require('./src/scripts/dbmsValidation');

app.get('/api/health/database', async (req, res) => {
  const health = await generateHealthReport();
  res.json(health);
});
```

Then monitor:
```bash
curl http://localhost:5000/api/health/database
```

---

## CHEAT SHEET

| Goal | Command |
|------|---------|
| Quick health check | `health-report` |
| Find broken data | `detect-orphans` |
| See what would be deleted | `cleanup-dry-run` |
| Delete broken data | `cleanup-live` |
| Start fresh | `reseed-live` |
| Full diagnosis | `full-check` |
| Check integrity | `validate-integrity` |
| Check consistency | `audit-consistency` |

---

## SUCCESS INDICATORS

### Health Report Output

**✅ HEALTHY**
```
Overall Health: HEALTHY
Integrity Score: 100%
Consistency Score: 100%
```
→ Everything is fine, no action needed

**⚠️ DEGRADED**
```
Overall Health: DEGRADED
Integrity Score: 95%
Consistency Score: 90%
Recommendation: Database has minor issues. Consider running cleanup.
```
→ Run cleanup, but not urgent

**⚠️ COMPROMISED**
```
Overall Health: COMPROMISED
Integrity Score: 80%
Consistency Score: 70%
Recommendation: Database has significant issues. Run cleanup immediately.
```
→ Run cleanup now

**🚨 CRITICAL**
```
Overall Health: CRITICAL
Integrity Score: 60%
Consistency Score: 50%
Recommendation: Database integrity is critical. Run cleanup and reseed if necessary.
```
→ Run cleanup immediately, consider reseed

---

## FAQ

**Q: Will this break my application?**  
A: No. Zero changes to routes, controllers, or UI. Everything works exactly as before.

**Q: Is cleanup safe?**  
A: Yes. Always preview with `cleanup-dry-run` first. Only deletes orphaned records.

**Q: What if I make a mistake?**  
A: Most commands ask for confirmation. Use `cleanup-dry-run` to preview first.

**Q: How often should I run health checks?**  
A: Daily recommended. Automated via cron job is ideal.

**Q: What if health is CRITICAL?**  
A: Run `full-check` to diagnose, then `cleanup-live`, then reseed if needed.

**Q: Can I use this in production?**  
A: Yes. Start with `health-report` daily. If issues arise, use cleanup tools.

---

## SUPPORT COMMANDS

```bash
# Show help
node src/scripts/dbms-cli.js help

# Show this quick start
cat DBMS_QUICK_START.md

# Read full guide
cat DBMS_HARDENING_GUIDE.md

# Read verification checklist
cat DBMS_HARDENING_VERIFICATION.md

# Read implementation report
cat DBMS_IMPLEMENTATION_REPORT.md
```

---

## REMEMBER

- ✅ Your database is now DBMS-solid
- ✅ Referential integrity is enforced
- ✅ Orphans are detected automatically
- ✅ Cleanup tools are safe
- ✅ No application changes needed
- ✅ Run health checks regularly

**You're good to go! 🚀**

---

**Last Updated**: January 25, 2026  
**Status**: Production Ready
