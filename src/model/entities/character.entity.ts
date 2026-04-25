/**
 * Entidades de dominio para a ficha de personagem do Sistema Daemon.
 * Estas interfaces refletem o contrato de entrada/saida do erebus-engine.
 */

export interface CharacterAttributes {
  FR: number;
  DEX: number;
  AGI: number;
  CON: number;
  INT: number;
  WILL: number;
  CAR: number;
  PER: number;
}

export interface CharacterEnhancement {
  id: number;
  nome: string;
  custo: number; // positivo = vantagem, negativo = desvantagem
}

export interface CharacterSkill {
  id: number;
  nome: string;
  pontos: number;
}

export interface Character {
  name: string;
  age: number;
  level: number;
  attributes: CharacterAttributes;
  enhancements: CharacterEnhancement[];
  skills: CharacterSkill[];
}

export interface CharacterComputed {
  pv: number;
  iniciativa: number;
  skillBudget: number;
  skillBudgetUsed: number;
  attributeBudget: number;
  attributeBudgetUsed: number;
  enhancementBudget: number;
  enhancementBudgetUsed: number;
}

export interface CharacterValidationError {
  code: string;
  message: string;
  skillId?: number;
}

export interface CharacterValidationResult {
  valid: boolean;
  computed: CharacterComputed;
  errors: CharacterValidationError[];
}
