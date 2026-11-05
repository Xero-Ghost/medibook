import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Resolve independently of the directory from which npm or Vercel starts Node.
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
