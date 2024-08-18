const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createContactsTable } = require('./db/migrations/create-contacts-table');

const app = express();

createContactsTable();

app.use(cors());
app.use(bodyParser.json());

const contactRoutes = require('./routes/contactRoutes');
const healthRoutes = require('./routes/healthRoutes');
app.use('/api/contacts', contactRoutes);
app.use('/api/health', healthRoutes);

module.exports = app;
