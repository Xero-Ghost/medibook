import app from './app.js';
import { connectDB } from './config/db.js';

const port = process.env.PORT || 5000;
try {
  await connectDB();
  app.listen(port, () => console.log(`MediBook API listening on http://localhost:${port}`));
} catch (error) {
  console.error('API startup failed:', error.message);
  process.exitCode = 1;
}
