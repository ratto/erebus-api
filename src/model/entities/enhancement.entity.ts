export interface Enhancement {
  id: number;
  nome: string;
  descricao: string;
  tipo: 'positivo' | 'negativo';
  custo: number;
}
