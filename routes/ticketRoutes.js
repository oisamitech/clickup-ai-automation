import express from 'express';
import TicketController from '../controllers/ticketController.js';

const router = express.Router();
const controller = new TicketController();

router.post('/categorize', (req, res) => controller.categorizeTicket(req, res));
router.post('/save-tickets', (req, res) => controller.saveTickets(req, res));

export default router;