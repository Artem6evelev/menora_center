/* Explicit process environment only. Never loads or prints env values. */
const { checkEnvironment } = require("./telegram-env.cjs");
const result = checkEnvironment(process.env);
for (const row of result)
  console.log(
    `${row.name}: ${row.present ? "present" : "missing"} / ${row.valid ? "valid" : "invalid"}`,
  );
process.exitCode = result.every((row) => row.valid) ? 0 : 1;
