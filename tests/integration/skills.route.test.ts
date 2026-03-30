import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { skills as skillsTable } from '../../src/infrastructure/database/schema.ts';
import { SkillRepository } from '../../src/repositories/skill.repository.ts';
import { SkillService } from '../../src/services/skill.service.ts';
import { SkillController } from '../../src/controllers/skill.controller.ts';
import type { Skill } from '../../src/model/entities/skill.entity.ts';

// Build an in-memory DB for integration tests
function buildTestApp() {
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      grupo TEXT,
      atributo_base TEXT,
      apenas_com_treinamento INTEGER NOT NULL DEFAULT 0,
      sinergia TEXT,
      descricao TEXT NOT NULL
    )
  `);
  const db = drizzle({ client: sqlite });

  // Seed 3 skills
  db.insert(skillsTable).values([
    { nome: 'Espada', grupo: 'Combate', atributoBase: 'DEX', apenasComTreinamento: true, sinergia: null, descricao: 'Uso de espadas em combate.' },
    { nome: 'Magia', grupo: 'Arcano', atributoBase: 'INT', apenasComTreinamento: true, sinergia: 'Conhecimento Arcano (Arcano)', descricao: 'Lançar feitiços mágicos.' },
    { nome: 'Corrida', grupo: null, atributoBase: 'AGI', apenasComTreinamento: false, sinergia: null, descricao: 'Correr com velocidade.' },
  ]).run();

  // Wire up the stack manually (no DI container — avoids DB side-effects)
  const repo = new SkillRepository(db);
  const service = new SkillService(repo);
  const controller = new SkillController(service);

  const app = express();
  app.use(express.json());
  app.get('/api/v1/skills', (req, res) => controller.list(req, res));

  return app;
}

describe('GET /api/v1/skills', () => {
  const app = buildTestApp();

  it('returns 200', async () => {
    const res = await request(app).get('/api/v1/skills');
    expect(res.status).toBe(200);
  });

  it('returns a body with a "skills" key', async () => {
    const res = await request(app).get('/api/v1/skills');
    expect(res.body).toHaveProperty('skills');
  });

  it('returns a non-empty array of skills', async () => {
    const res = await request(app).get('/api/v1/skills');
    expect(Array.isArray(res.body.skills)).toBe(true);
    expect((res.body.skills as Skill[]).length).toBeGreaterThan(0);
  });

  it('each skill has the correct structure', async () => {
    const res = await request(app).get('/api/v1/skills');
    const skills = res.body.skills as Skill[];

    for (const skill of skills) {
      expect(typeof skill.id).toBe('number');
      expect(typeof skill.nome).toBe('string');
      expect(typeof skill.descricao).toBe('string');
      expect(typeof skill.apenasComTreinamento).toBe('boolean');
      expect('grupo' in skill).toBe(true);
      expect('atributoBase' in skill).toBe(true);
      expect('sinergia' in skill).toBe(true);
    }
  });

  it('returns exactly the 3 seeded skills', async () => {
    const res = await request(app).get('/api/v1/skills');
    expect((res.body.skills as Skill[]).length).toBe(3);
  });

  it('returns skills with correct field values', async () => {
    const res = await request(app).get('/api/v1/skills');
    const skills = res.body.skills as Skill[];
    const espada = skills.find((s) => s.nome === 'Espada');

    expect(espada).toBeDefined();
    expect(espada?.grupo).toBe('Combate');
    expect(espada?.atributoBase).toBe('DEX');
    expect(espada?.apenasComTreinamento).toBe(true);
    expect(espada?.sinergia).toBeNull();
    expect(espada?.descricao).toBe('Uso de espadas em combate.');
  });

  it('skills with null grupo are returned correctly', async () => {
    const res = await request(app).get('/api/v1/skills');
    const skills = res.body.skills as Skill[];
    const corrida = skills.find((s) => s.nome === 'Corrida');

    expect(corrida).toBeDefined();
    expect(corrida?.grupo).toBeNull();
    expect(corrida?.apenasComTreinamento).toBe(false);
  });
});
