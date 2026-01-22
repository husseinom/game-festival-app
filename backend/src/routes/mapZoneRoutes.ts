import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as mapZoneController from '../controllers/mapZoneController.js';

const router = Router();

router.get('/festival/:festivalId', verifyToken, mapZoneController.getByFestival);
router.get('/price-zone/:priceZoneId', verifyToken, mapZoneController.getByPriceZone);
router.post('/', verifyToken, mapZoneController.create);
router.post('/:id/festival-games', verifyToken, mapZoneController.addFestivalGame);
router.delete('/:id/festival-games/:festivalGameId', verifyToken, mapZoneController.removeFestivalGame);
router.delete('/:id', verifyToken, mapZoneController.deleteMapZone);

export default router;