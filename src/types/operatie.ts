export interface Operatie {
  id: string;
  denumire: string;
  valoare: number;
  created_at?: string;
  updated_at?: string;
}

export interface OperatieZi {
  denumire: string;
  valoare: number;
  piese: number;
  ore: number;
  bucOra: number;
  timestamp: string;
}
