import 'reflect-metadata';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import { LogsService } from '../services/logs.service.ts';

@injectable()
export class LogsController {
  constructor(@inject(TYPES.LogsService) private readonly logsService: LogsService) {}

  stream(req: Request, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const cleanup = this.logsService.subscribe(res);

    req.on('close', () => {
      cleanup();
    });
  }
}
