export interface Skill {
  id: number;
  nome: string;
  grupo: string | null;
  atributoBase: string | null;
  apenasComTreinamento: boolean;
  sinergia: string | null;
  descricao: string;
}
