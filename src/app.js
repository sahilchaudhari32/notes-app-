// src/app.js

import express from 'express';
import noteRoutes from "./routes/note.routes.js";

const app = express();

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/notes', noteRoutes);

// 404 — no route matched
app.use((req, res) => {
  res.status(404).json({ msg: 'Route not found.' });
});

export default app;