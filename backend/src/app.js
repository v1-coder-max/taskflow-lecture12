// app.js — builds and configures the Express app (does NOT start the server)
const path = require('path');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');            // don't advertise that we use Express
app.use(cors());
app.use(express.json({ limit: '10kb' })); // reject huge request bodies

// API
app.use('/api', apiRoutes);
app.use('/api', notFound);              // unknown /api/* URL → JSON 404

// Frontend (login.html, register.html, dashboard.html, css, js)
app.use(express.static(path.join(__dirname, '../../frontend')));

// Must be LAST — catches every error from above
app.use(errorHandler);

module.exports = app;
