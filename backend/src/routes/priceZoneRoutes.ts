import { Router, type NextFunction, type Request, type Response } from 'express';
import { verifyToken, type AuthRequest } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as priceZoneControlleer from '../controllers/priceZoneController.js';


const router = Router()

router.get('/types', priceZoneControlleer.getAllTypes)

router.get('/zones', priceZoneControlleer.getAllZones)

router.get('/festival/:festivalId', priceZoneControlleer.getZonesByFestival)

router.get('/:priceZoneId/reservations', verifyToken, priceZoneControlleer.getReservationsByPriceZone)

router.get('/:priceZoneId/games', verifyToken, priceZoneControlleer.getGamesByPriceZone)

router.post(
    '/add',
    verifyToken,
    requireRole(['ADMIN', 'SUPER_ORGANISATOR', 'ORGANISATOR']),
    priceZoneControlleer.create
);


export default router;
