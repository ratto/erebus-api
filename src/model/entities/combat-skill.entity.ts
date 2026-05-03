export interface CombatSkill {
  id: number;
  nome: string;
  tipo: 'melee' | 'ranged' | 'shield';
  atributoAtaque: string | null;
  atributoDefesa: string | null;
  aprimoramentoRequerido: string | null;
  descricao: string;
}
