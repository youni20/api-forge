/**
 * Cron Expression Translator & Scheduler API
 * Endpoints:
 *   GET /cron/explain?expression=0+12+*+*+MON-FRI
 *   GET /cron/next-runs?expression=0+12+*+*+MON-FRI&count=5
 */

// Simple robust description logic for standard 5-part cron expressions (minute hour day month weekday)
function explainCron(expr) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { valid: false, error: "Invalid cron format. Expected 5 parts: minute hour day_of_month month day_of_week" };
  }

  const [min, hour, dom, month, dow] = parts;

  // Basic descriptive mapping generator
  let timeStr = "";
  if (min === "0" && hour === "0") {
    timeStr = "at midnight";
  } else if (min === "0" && hour === "12") {
    timeStr = "at 12:00 PM (noon)";
  } else {
    timeStr = `at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
  }

  let dayStr = "";
  if (dom === "*" && month === "*" && dow === "*") {
    dayStr = "every day";
  } else if (dom === "*" && month === "*" && (dow === "1-5" || dow === "MON-FRI")) {
    dayStr = "Monday through Friday";
  } else if (dom === "*" && month === "*" && (dow === "0,6" || dow === "SAT,SUN")) {
    dayStr = "on weekends";
  } else {
    dayStr = `on day ${dom} of month ${month}, weekday ${dow}`;
  }

  return {
    valid: true,
    expression: expr,
    description: `Runs ${timeStr}, ${dayStr}.`
  };
}

// Basic next-run forecaster for demonstration
function getNextRuns(expr, count = 5) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { error: "Invalid cron format. Expected 5 parts." };
  }

  const results = [];
  let current = new Date();
  
  // Fast-forward step simulation for the next runs (hourly/daily approximation bounds)
  const maxIterations = 10000;
  let iterations = 0;

  // Target minute and hour extraction if simple numbers
  const targetMin = parseInt(parts[0], 10);
  const targetHour = parseInt(parts[1], 10);

  if (isNaN(targetMin) || isNaN(targetHour)) {
    return { error: "Advanced wildcard ranges for next-runs calculation require standard numeric parameters for this demo engine." };
  }

  while (results.length < count && iterations < maxIterations) {
    current.setMinutes(current.getMinutes() + 1);
    iterations++;

    if (current.getMinutes() === targetMin && current.getHours() === targetHour) {
      results.push(current.toISOString());
    }
  }

  return {
    expression: expr,
    requested_count: count,
    next_runs: results
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    if (pathname === "/cron/explain") {
      const expr = searchParams.get("expression");
      if (!expr) return json({ error: "Missing 'expression' query parameter." }, 400);
      return json(explainCron(expr));
    }

    if (pathname === "/cron/next-runs") {
      const expr = searchParams.get("expression");
      const count = parseInt(searchParams.get("count") || "5", 10);
      if (!expr) return json({ error: "Missing 'expression' query parameter." }, 400);
      return json(getNextRuns(expr, count));
    }

    if (pathname === "/" || pathname === "/health") {
      return json({
        status: "ok",
        endpoints: [
          "/cron/explain?expression=0+12+*+*+MON-FRI",
          "/cron/next-runs?expression=0+12+*+*+5"
        ]
      });
    }

    return json({ error: "Not found" }, 404);
  }
};
