# 🔒 Security Guidelines for Survey Savvy

## Environment Variables

### 🚨 Critical Secrets (NEVER commit these)
- `TREASURY_PRIVATE_KEY` - Controls withdrawal funds
- `WLD_CLIENT_SECRET` - World ID authentication
- `DEV_PORTAL_API_KEY` - Worldcoin API access
- `JWT_SECRET` - Token signing key
- `NEXTAUTH_SECRET` - NextAuth session encryption
- `DATABASE_URL` - Database credentials

### 🌐 Public Variables (Safe to expose)
- `NEXT_PUBLIC_*` - All variables starting with this prefix
- `APP_ID` - Public World ID app identifier
- `WLD_CLIENT_ID` - Public World ID client ID

## Production Deployment Checklist

### ✅ Before Deploying:
1. **Generate New Keys**:
   - [ ] Create new `TREASURY_PRIVATE_KEY` (64-char hex)
   - [ ] Generate secure `JWT_SECRET` (minimum 32 characters)
   - [ ] Create random `NEXTAUTH_SECRET`

2. **Environment Configuration**:
   - [ ] Set `WORLDCOIN_BYPASS=0` or remove entirely
   - [ ] Update `NEXTAUTH_URL` to production domain
   - [ ] Configure production `DATABASE_URL`

3. **Security Verification**:
   - [ ] Verify `.env` is in `.gitignore`
   - [ ] Check no secrets are hardcoded in source
   - [ ] Confirm treasury wallet is funded
   - [ ] Test World ID actions in production

### 🔧 Development vs Production

#### Development:
```bash
# Local development only
WORLDCOIN_BYPASS=1
NEXTAUTH_URL=http://localhost:3000
```

#### Production:
```bash
# Production settings
WORLDCOIN_BYPASS=0  # or remove this line
NEXTAUTH_URL=https://your-domain.com
```

## Treasury Wallet Security

### 🏦 Wallet Management:
- Private key has access to withdrawal funds
- Monitor wallet balance regularly
- Use multi-sig wallet for large deployments
- Keep backup of private key in secure location

### 💰 Funding Requirements:
- ETH for gas fees (World Chain)
- WLD tokens for user withdrawals
- Monitor and refill as needed

## Code Security

### 🚫 Never Commit:
- Private keys or mnemonics
- API secrets or tokens
- Database credentials
- User data or logs

### ✅ Security Best Practices:
- All secrets in environment variables
- Input validation on all API endpoints
- Rate limiting implemented
- World ID verification enforced
- SQL injection prevention (parameterized queries)

## Monitoring

### 📊 Monitor These:
- Treasury wallet balance
- Failed verification attempts
- API rate limiting hits
- Database connection status
- Withdrawal transaction success rates

## Emergency Procedures

### 🚨 If Private Key Compromised:
1. Immediately transfer all funds to new wallet
2. Update `TREASURY_PRIVATE_KEY` in production
3. Redeploy application
4. Monitor for unauthorized transactions

### 🔄 Regular Security Maintenance:
- Rotate JWT secrets monthly
- Update dependencies regularly
- Review access logs
- Backup database securely

---

**Remember**: Security is everyone's responsibility. When in doubt, ask!
