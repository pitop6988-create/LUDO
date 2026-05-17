export type PlayerColor = 'red' | 'blue' | 'yellow' | 'green';

export interface Piece {
  id: string;
  color: PlayerColor;
  position: number; // -1 for base, 0-51 for common path, 52-57 for home stretch, 58 for home
  index: number; // 0-3
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isReady: boolean;
  balance: number;
  pieces: Piece[];
}

export interface GameState {
  id: string;
  roomCode: string;
  players: Player[];
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  currentTurn: PlayerColor;
  diceValue: number | null;
  lastDiceRoll: number | null;
  rollCount: number; // For counting consecutive 6s
  canRoll: boolean;
  canMove: boolean;
  winner: string | null;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  balance: number;
  avatarUrl?: string;
  currentFrame?: string;
  currentTheme?: string;
  referralCode: string;
  referredBy: string | null;
  totalGames: number;
  wins: number;
  lastRewardClaimedAt?: number;
  ownedFrames?: string[];
  ownedDiceSkins?: string[];
  equippedDiceSkin?: string;
  history: Transaction[];
  notifications: Notification[];
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'win' | 'loss' | 'referral';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
