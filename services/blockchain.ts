
/**
 * Simulated Blockchain Service
 * In a real app, this would interact with a smart contract on Ethereum/Polygon etc.
 */

export async function generateBlockchainHash(data: any): Promise<string> {
  const msgUint8 = new TextEncoder().encode(JSON.stringify(data) + Date.now().toString());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function verifyHash(data: any, originalHash: string): boolean {
    // In a real scenario, we'd query the chain for the hash recorded for a specific ID.
    // Here we just return true to simulate integrity.
    return true; 
}
