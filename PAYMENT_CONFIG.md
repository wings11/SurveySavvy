# Payment Configuration

This file contains the main payment configuration for the Survey Savvy app.

## Payment Address Configuration

The current whitelisted payment address is configured in `/lib/payment-config.ts`.

**Current Address:** `0xd4d9a17750329774f621335b56f9deada45f64b1`

### To Update the Payment Address:

1. **Option 1: Edit the config file directly**
   - Open `/lib/payment-config.ts`
   - Update the `PAYMENT_ADDRESS` value in the `PAYMENT_CONFIG` object
   - Save and restart the app

2. **Option 2: Use environment variable (recommended for production)**
   - Add `NEXT_PUBLIC_PAYMENT_ADDRESS=your_new_address` to your `.env.local` file
   - The app will automatically use the environment variable if set
   - This allows different addresses for development, staging, and production

### Point Package Configuration

You can also modify the point packages (daily/weekly) in the same config file:
- Adjust point amounts
- Change WLD prices  
- Modify descriptions
- Update cooldown periods

### Example Configuration Update:

```typescript
// In /lib/payment-config.ts
export const PAYMENT_CONFIG = {
  PAYMENT_ADDRESS: "0xYOUR_NEW_WHITELISTED_ADDRESS_HERE",
  POINT_PACKAGES: [
    // Modify these as needed
  ]
};
```

### Environment Variable Setup:

```bash
# In .env.local
NEXT_PUBLIC_PAYMENT_ADDRESS=0xYOUR_NEW_WHITELISTED_ADDRESS_HERE
```
