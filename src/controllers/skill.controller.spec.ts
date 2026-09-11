import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '../errors/not-found.error';

import { SkillController } from './skill.controller';

import type { SkillDetailResponseDto, SkillResponseDto } from '../models/dtos/skill.dto';
import type { ISkillService } from '../services/interfaces/skill.service.interface';
import type { NextFunction, Request, Response } from 'express';

const listDto: SkillResponseDto = {
  id: 12,
  name: 'Condução',
  parentSkillId: null,
  parentSkillName: null,
  hasSubgroups: true,
  baseAttribute: 'AGI',
  effectiveBaseAttribute: 'AGI',
  category: null,
  description: 'Perícia de grupo para operar veículos.',
  initialValueType: 'instinctive',
  prerequisite: null,
  damage: null,
  notes: null,
  sourceLevel: 1,
  source: 'pericias.json → lista · manual l.809',
  editionOrVersion: 'Manual Básico 1.04 (dez/2022)',
};

const detailDto: SkillDetailResponseDto = { ...listDto, subgroups: [] };

describe('SkillController', () => {
  let service: ISkillService;
  let controller: SkillController;
  let response: Response;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    service = { list: vi.fn(), getById: vi.fn() };
    controller = new SkillController(service);
    response = {
      locals: {},
      set: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    next = vi.fn();
  });

  describe('list', () => {
    it('passes the validated filter to the service', async () => {
      response.locals.validated = { name: 'condu', rootOnly: true };
      vi.mocked(service.list).mockResolvedValue([]);

      await controller.list({} as Request, response, next);

      expect(service.list).toHaveBeenCalledTimes(1);
      expect(service.list).toHaveBeenCalledWith({ name: 'condu', rootOnly: true });
    });

    it('answers 200 with the service result', async () => {
      vi.mocked(service.list).mockResolvedValue([listDto]);

      await controller.list({} as Request, response, next);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith([listDto]);
      expect(next).not.toHaveBeenCalled();
    });

    it('lets the edge cache the catalogue, which only changes on deploy', async () => {
      vi.mocked(service.list).mockResolvedValue([]);

      await controller.list({} as Request, response, next);

      expect(response.set).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=300, stale-while-revalidate=86400',
      );
    });

    it('delegates a thrown error to the error handler', async () => {
      const failure = new Error('boom');
      vi.mocked(service.list).mockRejectedValue(failure);

      await controller.list({} as Request, response, next);

      expect(next).toHaveBeenCalledWith(failure);
      expect(response.status).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('passes the validated identifier to the service', async () => {
      response.locals.validated = { id: 12 };
      vi.mocked(service.getById).mockResolvedValue(detailDto);

      await controller.getById({} as Request, response, next);

      expect(service.getById).toHaveBeenCalledWith(12);
    });

    it('answers 200 with the detail payload', async () => {
      response.locals.validated = { id: 12 };
      vi.mocked(service.getById).mockResolvedValue(detailDto);

      await controller.getById({} as Request, response, next);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(detailDto);
    });

    it('lets the edge cache the detail payload as well', async () => {
      response.locals.validated = { id: 12 };
      vi.mocked(service.getById).mockResolvedValue(detailDto);

      await controller.getById({} as Request, response, next);

      expect(response.set).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=300, stale-while-revalidate=86400',
      );
    });

    it('delegates a NotFoundError instead of answering it itself', async () => {
      response.locals.validated = { id: 999 };
      const failure = new NotFoundError('Skill with id 999 was not found.');
      vi.mocked(service.getById).mockRejectedValue(failure);

      await controller.getById({} as Request, response, next);

      expect(next).toHaveBeenCalledWith(failure);
      expect(response.json).not.toHaveBeenCalled();
    });
  });
});
