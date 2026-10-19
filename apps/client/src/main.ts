import { bootstrapGame } from "./app/GameBootstrap.js";

bootstrapGame().catch((err) => {
  console.error("Failed to bootstrap Tông Môn 8D:", err);
});
