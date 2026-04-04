export interface Weapon {
  id: number;
  nome: string;
  categoria: string;
  dano: string;
  iniciativa: string;
  fonte: string;
  tipo: string;
  tipoDano: string | null;
  ocultabilidade: string | null;
  alcanceMedio: string | null;
  alcanceMax: string | null;
  calibre: string | null;
  alcanceEfetivo: string | null;
  rof: string | null;
  pente: string | null;
}
