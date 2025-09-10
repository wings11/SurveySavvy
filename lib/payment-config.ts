// Payment configuration for the app
export const PAYMENT_CONFIG = {
  // Whitelisted payment address - update this as needed
  PAYMENT_ADDRESS: "0xd4d9a17750329774f621335b56f9deada45f64b1",
  
  // Point packages configuration
  POINT_PACKAGES: [
    { 
      id: 'daily' as const, 
      points: 10, 
      wldPrice: 0.05, 
      description: 'Daily limit: 10 points for 0.05 WLD',
      cooldownDays: 1
    },
    { 
      id: 'weekly' as const, 
      points: 70, 
      wldPrice: 0.3, 
      description: 'Weekly bundle: 70 points for 0.3 WLD (15% savings!)',
      cooldownDays: 7
    }
  ]
} as const;

// Helper function to get payment address
export const getPaymentAddress = (): string => {
  // You can add environment variable support here if needed
  return process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || PAYMENT_CONFIG.PAYMENT_ADDRESS;
};

// Helper function to get point packages
export const getPointPackages = () => {
  return PAYMENT_CONFIG.POINT_PACKAGES;
};
