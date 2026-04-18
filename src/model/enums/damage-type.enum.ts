/**
 * DamageType — Tipos de dano do Sistema Daemon.
 *
 * Os tipos de dano modelam a interação entre armas/efeitos e proteções (armaduras, resistências).
 *
 * Convenção de uso padrão:
 *  - Armas brancas e de disparo (arco, besta): KINETIC (padrão, sem modificação mágica/elemental).
 *  - Armas de fogo: BALLISTIC, exceto lança-chamas (FIRE) e lançadores de granada (dano variável).
 *
 * Valores numéricos são explícitos e estáveis para garantir compatibilidade de serialização JSON
 * entre a API e o frontend (erebus-app).
 */
export enum DamageType {
  KINETIC   = 0,
  BALLISTIC = 1,
  FIRE      = 2,
  COLD      = 3,
  GAS       = 4,
  ACID      = 5,
  VACUUM    = 6,
}

export const VALID_DAMAGE_TYPES = Object.values(DamageType).filter(
  (v): v is DamageType => typeof v === 'number',
);
