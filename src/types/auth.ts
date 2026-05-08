export enum PortalType {
  SUPER_ADMIN = 'super_admin',
  INSURER = 'insurer',
  REINSURER = 'reinsurer',
  REINSURER_BROKER = 'reinsurer_broker',
  BROKER = 'broker',
  MARKET_ADMIN = 'market_admin',
  CALL_CENTER = 'call_center',
}

export type PortalTypeString =
  | 'super_admin'
  | 'insurer'
  | 'reinsurer'
  | 'reinsurer_broker'
  | 'broker'
  | 'market_admin'
  | 'call_center';
