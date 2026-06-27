export interface Member {
  id: string;
  name: string;
}

export interface Exclusion {
  description: string;
  amount: number;
}

export interface Group {
  groupId: string;
  name: string;
  members: Member[];
  status: 'active' | 'settled';
  ttl: number;
  createdAt: string;
}

export interface Payment {
  paymentId: string;
  groupId: string;
  memberId: string;
  description: string;
  totalAmount: number;
  exclusions: Exclusion[];
  netAmount: number;
}

export interface Settlement {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
