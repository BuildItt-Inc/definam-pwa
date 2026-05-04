export function getPaystackConfig() {
  return {
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
    secretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
  };
}
