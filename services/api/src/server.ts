import { app } from "./app";
import { env } from "./lib/env";

app.listen(env.port, () => {
  console.log(`Mid-Day Meal API listening on http://localhost:${env.port}`);
});
