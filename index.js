import express from 'express';
import 'dotenv/config';
import TicketRouter from './routes/ticketRoutes.js';

const app = express();

app.use(express.json());

app.use("/tickets", TicketRouter);

app.listen(process.env.PORT, () => console.log(`Running in port ${process.env.PORT}!`))