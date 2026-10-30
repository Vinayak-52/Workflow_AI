import { execFile } from 'child_process';
import path from 'path';

export interface MLPrediction {
  priority: 'low' | 'medium' | 'high';
  score: number;
  engine: string;
  modelVersion: string;
}

export class MLService {
  public static async predictPriority(features: {
    hoursUntilDeadline: number;
    durationMinutes: number;
    userImportance?: number;
    availableFreeMins?: number;
    otherTasksDue?: number;
    workloadScore?: number;
  }): Promise<MLPrediction> {
    const payload = {
      hours_until_deadline: features.hoursUntilDeadline,
      duration_minutes: features.durationMinutes,
      user_importance: features.userImportance || 3,
      available_free_mins: features.availableFreeMins || 120.0,
      other_tasks_due: features.otherTasksDue || 2,
      workload_score: features.workloadScore || 0.4,
    };

    const pythonExe = path.resolve(__dirname, '../../../ml/.venv/Scripts/python.exe');
    const predictScript = path.resolve(__dirname, '../../../ml/src/predict.py');

    return new Promise((resolve) => {
      execFile(pythonExe, [predictScript, JSON.stringify(payload)], { timeout: 4000 }, (err, stdout) => {
        if (!err && stdout) {
          try {
            const parsed = JSON.parse(stdout.trim());
            return resolve(parsed);
          } catch {
            // parse error fallback
          }
        }

        // Deterministic baseline rule fallback
        const hours = features.hoursUntilDeadline;
        let priority: 'low' | 'medium' | 'high' = 'medium';
        let score = 0.55;

        if (hours <= 24.0 || (features.userImportance && features.userImportance >= 4)) {
          priority = 'high';
          score = 0.88;
        } else if (hours <= 72.0) {
          priority = 'medium';
          score = 0.60;
        } else {
          priority = 'low';
          score = 0.35;
        }

        resolve({
          priority,
          score,
          engine: 'baseline_rules_fallback',
          modelVersion: 'baseline-rule-v1',
        });
      });
    });
  }
}
