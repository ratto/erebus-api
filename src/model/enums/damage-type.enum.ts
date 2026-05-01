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
  ELECTRIC  = 7,
}

export const VALID_DAMAGE_TYPES = Object.values(DamageType).filter(
  (v): v is DamageType => typeof v === 'number',
);

const DAMAGE_TYPE_KEYS = Object.keys(DamageType).filter(
  (k) => isNaN(Number(k)),
) as Array<keyof typeof DamageType>;

/**
 * Converte um valor numérico do enum para sua chave string correspondente.
 * Ex: damageTypeToString(DamageType.KINETIC) → 'KINETIC'
 */
export function damageTypeToString(t: DamageType): keyof typeof DamageType {
  const key = DAMAGE_TYPE_KEYS.find((k) => DamageType[k] === t);
  if (key === undefined) throw new Error(`Unknown DamageType value: ${t}`);
  return key;
}

/**
 * Converte uma chave string para o valor numérico do enum.
 * Ex: damageTypeFromString('KINETIC') → DamageType.KINETIC
 * Lança erro se a string não for válida.
 */
export function damageTypeFromString(s: string): DamageType {
  const key = s as keyof typeof DamageType;
  if (!(key in DamageType) || typeof DamageType[key] !== 'number') {
    throw new Error(`Unknown DamageType key: ${s}`);
  }
  return DamageType[key] as DamageType;
}
