import 'reflect-metadata';
import { spawn } from 'child_process';
import path from 'path';
import { injectable } from 'inversify';
import type { DiceRoll } from '../model/entities/dice.entity.ts';
import { DiceType } from '../model/enums/dice-type.enum.ts';

export interface ICoreAdapter {
  rollDice(diceType: DiceType, count: number): Promise<DiceRoll>;
}

@injectable()
export class CoreAdapter implements ICoreAdapter {
  private readonly binaryPath: string;

  constructor() {
    this.binaryPath = path.resolve(process.env['CORE_PATH'] ?? './core/build/erebus');
  }

  rollDice(diceType: DiceType, count: number): Promise<DiceRoll> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.binaryPath, [], { stdio: ['pipe', 'pipe', 'pipe'] });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Core process exited with code ${code}: ${stderr}`));
        }
        try {
          resolve(JSON.parse(stdout) as DiceRoll);
        } catch {
          reject(new Error(`Failed to parse core response: ${stdout}`));
        }
      });

      proc.on('error', (err) => reject(new Error(`Failed to spawn core binary at "${this.binaryPath}": ${err.message}`)));

      const command = JSON.stringify({ command: 'dice.roll', diceType, count });
      proc.stdin.write(command);
      proc.stdin.end();
    });
  }
}
