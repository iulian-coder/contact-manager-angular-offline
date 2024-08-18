const express = require('express');
const { getContacts, getContactById, createContact, updateContact, deleteContact, addRandomContacts } = require('../controllers/contactController');

const router = express.Router();

router.get('/', getContacts);
router.get('/:id', getContactById);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

router.post('/random', addRandomContacts);


module.exports = router;
