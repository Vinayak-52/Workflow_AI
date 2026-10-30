import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/clock?timezone=
router.get('/clock', (req: Request, res: Response) => {
  const requestedTz = (req.query.timezone as string) || 'Asia/Kolkata';

  let resolvedTz = requestedTz;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: requestedTz });
  } catch {
    resolvedTz = 'Asia/Kolkata';
  }

  const now = new Date();
  
  // Format local ISO-like string for the given timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolvedTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  // Construct ISO string with offset
  const localIso = `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}`;

  res.json({
    now: localIso,
    timezone: resolvedTz,
    utcOffset: resolvedTz === 'Asia/Kolkata' ? '+05:30' : '+00:00',
  });
});

export default router;
