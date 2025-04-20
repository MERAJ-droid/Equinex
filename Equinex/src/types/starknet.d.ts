// Type definitions for Starknet browser wallet
interface Window {
    starknet?: {
      enable: () => Promise<void>;
      selectedAddress: string;
      provider: any;
      isConnected: boolean;
      account: {
        address: string;
        signer: any;
      };
      request: (params: { type: string; method: string; params?: any }) => Promise<any>;
    };
  }
  
  // Starknet contract types
  declare module 'starknet' {
    export class Provider {
      constructor(options?: { sequencer?: { network?: string } });
      getBlock(blockIdentifier: string | number): Promise<any>;
      getTransaction(txHash: string): Promise<any>;
      getTransactionReceipt(txHash: string): Promise<any>;
      callContract(call: any): Promise<any>;
      waitForTransaction(txHash: string): Promise<any>;
    }
  
    export class Contract {
      constructor(abi: any, address: string, providerOrAccount: Provider | Account);
      connect(account: Account): void;
      [key: string]: any; // Allow dynamic method access
    }
  
    export class Account {
      constructor(provider: Provider, address: string, privateKey?: string);
      execute(calls: any[]): Promise<any>;
      [key: string]: any; // Allow dynamic method access
    }
  
    export const ec: {
      getKeyPair: (privateKey: string) => any;
      getStarkKey: (keyPair: any) => string;
    };
  
    export const constants: {
      StarknetChainId: {
        MAINNET: string;
        TESTNET: string;
      };
    };
  
    export const stark: {
      randomAddress: () => string;
      formatSignature: (signature: any) => string;
      makeAddress: (input: string) => string;
      shortStringToBigInt: (str: string) => bigint;
      bigIntToShortString: (value: bigint) => string;
    };
  }
  