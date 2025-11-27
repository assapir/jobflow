import { Router } from 'express';
import { searchLinkedInJobs, clearLinkedInCache } from '../controllers/linkedin.js';

const router = Router();

// GET /api/linkedin/search?q={query}&location={location}
router.get('/search', searchLinkedInJobs);

// POST /api/linkedin/cache/clear - Clear the search cache
router.post('/cache/clear', clearLinkedInCache);

export default router;

