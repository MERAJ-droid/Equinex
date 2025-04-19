export interface VerificationRequest {
    address: string;
    name: string;
    email: string;
    contactInfo: string;
    socialLink: string;
    timestamp: number;
    status: 'pending' | 'approved' | 'rejected';
  }
  
  export interface VerifiedUser {
    address: string;
    name: string;
    verificationDate: number;
  }
  