/**
 * Codigos dos 8 atributos base do Sistema Daemon.
 * Espelha o enum AttributeCode do erebus-engine.
 */
export const AttributeCode = ['FR', 'DEX', 'AGI', 'CON', 'INT', 'WILL', 'CAR', 'PER'] as const;
export type AttributeCode = (typeof AttributeCode)[number];
