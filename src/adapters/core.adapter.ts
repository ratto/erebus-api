import 'reflect-metadata';
import { spawn } from 'child_process';
import path from 'path';
import { injectable } from 'inversify';
import type { DiceRoll } from '../model/entities/dice.entity.ts';
import { DiceType } from '../model/enums/dice-type.enum.ts';
import type { Character, CharacterValidationResult } from '../model/entities/character.entity.ts';

export interface ICoreAdapter {
  rollDice(diceType: DiceType, count: number): Promise<DiceRoll>;
  validateCharacter(character: Character): Promise<CharacterValidationResult>;
}

@injectable()
export class CoreAdapter implements ICoreAdapter {
  private readonly binaryPath: string;

  constructor() {
    this.binaryPath = path.resolve(process.env['EREBUS_CORE_PATH'] ?? './core/build/erebus');
  }

  /**
   * Helper privado que serializa um comando JSON, envia ao binario do engine
   * via stdin e retorna o stdout parseado como T.
   * Reaproveitado por rollDice e validateCharacter para evitar duplicacao.
   */
  private runCommand<T>(payload: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.binaryPath, [], { stdio: ['pipe', 'pipe', 'pipe'] });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Core process exited with code ${code}: ${stderr}`));
        }
        try {
          resolve(JSON.parse(stdout) as T);
        } catch {
          reject(new Error(`Failed to parse core response: ${stdout}`));
        }
      });

      proc.on('error', (err) =>
        reject(new Error(`Failed to spawn core binary at "${this.binaryPath}": ${err.message}`)),
      );

      proc.stdin.write(JSON.stringify(payload));
      proc.stdin.end();
    });
  }

  rollDice(diceType: DiceType, count: number): Promise<DiceRoll> {
    return this.runCommand<DiceRoll>({ command: 'dice.roll', diceType, count });
  }

  validateCharacter(character: Character): Promise<CharacterValidationResult> {
    return this.runCommand<CharacterValidationResult>({ command: 'character.validate', character });
  }
}
