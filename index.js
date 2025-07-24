import express from 'express';
import TicketRouter from './routes/ticketRoutes.js';

const app = express();

app.use(express.json());

app.use("/tickets", TicketRouter);

app.listen(3000, () => console.log(`Running in port 3000!`))