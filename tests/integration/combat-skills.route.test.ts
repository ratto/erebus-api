import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { combatSkills as combatSkillsTable } from '../../src/infrastructure/database/schema.ts';
import { CombatSkillRepository } from '../../src/repositories/combat-skill.repository.ts';
import { CombatSkillService } from '../../src/services/combat-skill.service.ts';
import { CombatSkillController } from '../../src/controllers/combat-skill.controller.ts';
import type { CombatSkill } from '../../src/model/entities/combat-skill.entity.ts';

function buildTestApp() {
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS combat_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL,
      atributo_ataque TEXT,
      atributo_defesa TEXT,
      aprimoramento_requerido TEXT,
      descricao TEXT NOT NULL
    )
  `);
  const db = drizzle({ client: sqlite });

  db.insert(combatSkillsTable).values([
    {
      nome: 'Espada',
      tipo: 'melee',
      atributoAtaque: 'DEX',
      atributoDefesa: 'DEX',
      aprimoramentoRequerido: null,
      descricao: 'Uso de espadas em combate.',
    },
    {
      nome: 'Pistolas',
      tipo: 'ranged',
      atributoAtaque: 'DEX',
      atributoDefesa: null,
      aprimoramentoRequerido: 'Armas de Fogo',
      descricao: 'Uso de pistolas em combate à distância.',
    },
    {
      nome: 'Escudo',
      tipo: 'shield',
      atributoAtaque: null,
      atributoDefesa: 'DEX',
      aprimoramentoRequerido: null,
      descricao: 'Uso de escudos para defesa.',
    },
  ]).run();

  const repo = new CombatSkillRepository(db);
  const service = new CombatSkillService(repo);
  const controller = new CombatSkillController(service);

  const app = express();
  app.use(express.json());
  app.get('/api/v1/combat-skills', (req, res) => controller.list(req, res));

  return app;
}

describe('GET /api/v1/combat-skills', () => {
  const app = buildTestApp();

  it('returns 200', async () => {
    const res = await request(app).get('/api/v1/combat-skills');
    expect(res.status).toBe(200);
  });

  it('returns a direct array of combat skills', async () => {
    const res = await request(app).get('/api/v1/combat-skills');
    expect(Array.isArray(res.body)).toBe(true);
    expect((res.body as CombatSkill[]).length).toBeGreaterThan(0);
  });

  it('each combat skill has the correct structure', async () => {
    const res = await request(app).get('/api/v1/combat-skills');
    const combatSkills = res.body as CombatSkill[];

    for (const skill of combatSkills) {
      expect(typeof skill.id).toBe('number');
      expect(typeof skill.nome).toBe('string');
      expect(typeof skill.tipo).toBe('string');
      expect(typeof skill.descricao).toBe('string');
      expect('atributoAtaque' in skill).toBe(true);
      expect('atributoDefesa' in skill).toBe(true);
      expect('aprimoramentoRequerido' in skill).toBe(true);
    }
  });

  it('contains at least one melee, one ranged and one shield skill', async () => {
    const res = await request(app).get('/api/v1/combat-skills');
    const combatSkills = res.body as CombatSkill[];

    const types = combatSkills.map((s) => s.tipo);
    expect(types).toContain('melee');
    expect(types).toContain('ranged');
    expect(types).toContain('shield');
  });

  it('tipo field only contains valid values', async () => {
    const res = await request(app).get('/api/v1/combat-skills');
    const combatSkills = res.body as CombatSkill[];

    for (const skill of combatSkills) {
      expect(['melee', 'ranged', 'shield']).toContain(skill.tipo);
    }
  });

  it('ranged skill has null atributoDefesa', async () => {
    const res = await request(app).get('/api/v1/combat-skills');
    const combatSkills = res.body as CombatSkill[];
    const pistolas = combatSkills.find((s) => s.nome === 'Pistolas');

    expect(pistolas).toBeDefined();
    expect(pistolas?.tipo).toBe('ranged');
    expect(pistolas?.atributoDefesa).toBeNull();
    expect(pistolas?.aprimoramentoRequerido).toBe('Armas de Fogo');
  });

  it('shield skill has null atributoAtaque', async () => {
    const res = await request(app).get('/api/v1/combat-skills');
    const combatSkills = res.body as CombatSkill[];
    const escudo = combatSkills.find((s) => s.nome === 'Escudo');

    expect(escudo).toBeDefined();
    expect(escudo?.tipo).toBe('shield');
    expect(escudo?.atributoAtaque).toBeNull();
  });

  it('returns exactly the 3 seeded combat skills', async () => {
    const res = await request(app).get('/api/v1/combat-skills');
    expect((res.body as CombatSkill[]).length).toBe(3);
  });
});
