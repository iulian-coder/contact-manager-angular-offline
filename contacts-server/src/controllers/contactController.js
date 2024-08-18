const db = require('../db/sqlite-db');
const axios = require('axios');

const getContacts = (req, res) => {
    const sql = 'SELECT * FROM contacts';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ data: rows });
    });
};

const getContactById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM contacts WHERE id = ?';
    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ data: row });
    });
};

const createContact = (req, res) => {
    const { name, address, email, phone, cell, registration_date, age, profile_picture } = req.body;
    const sql = 'INSERT INTO contacts (name, address, email, phone, cell, registration_date, age, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [name, address, email, phone, cell, registration_date, age, profile_picture];
    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ id: this.lastID });
    });
};

const updateContact = (req, res) => {
    const { id } = req.params;
    const { name, address, email, phone, cell, registration_date, age, profile_picture } = req.body;
    const sql = 'UPDATE contacts SET name = ?, address = ?, email = ?, phone = ?, cell = ?, registration_date = ?, age = ?, profile_picture = ? WHERE id = ?';
    const params = [name, address, email, phone, cell, registration_date, age, profile_picture, id];
    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ changes: this.changes });
    });
};

const deleteContact = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM contacts WHERE id = ?';
    db.run(sql, id, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ changes: this.changes });
    });
};




// Function to add random contacts
const addRandomContacts = async (req, res) => {
    try {
        const response = await fetch('https://randomuser.me/api/?nat=US&results=10');
        const data = await response.json();

        const sql = 'INSERT INTO contacts (name, address, email, phone, cell, registration_date, age, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const stmt = db.prepare(sql);

        let completedInserts = 0;
        const totalInserts = data.results.length;

        for (const user of data.results) {
            const name = `${user.name.first} ${user.name.last}`;
            const address = `${user.location.street.number} ${user.location.street.name}, ${user.location.city}, ${user.location.state}, ${user.location.country}`;
            const email = user.email;

            // Format the phone and cell numbers
            const phone = formatPhoneNumber(user.phone, user.nat);
            const cell = formatPhoneNumber(user.cell, user.nat);

            const registration_date = user.registered.date;
            const age = user.dob.age;

            const imageUrl = user.picture.large;
            const profilePicture = imageUrl ? await imageUrlToBase64(imageUrl) : null;

            stmt.run(name, address, email, phone, cell, registration_date, age, profilePicture, function (err) {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }

                completedInserts++;

                if (completedInserts === totalInserts) {
                    stmt.finalize();
                    res.status(201).json({ message: 'Random contacts added' });
                }
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

function formatPhoneNumber(phone, nationality) {
    const phonePattern = /^\+[0-9]{6,14}$/;
    let cleanedPhone = phone.replace(/\D/g, '');
    let countryCode = '';
    switch (nationality) {
        case 'US': countryCode = '+1'; break;
        default: countryCode = '';
    }
    const formattedPhone = `${countryCode}${cleanedPhone}`;
    return phonePattern.test(formattedPhone) ? formattedPhone : 'Invalid format';
}

async function imageUrlToBase64(url) {
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer'
        });

        const base64 = Buffer.from(response.data).toString('base64');
        const contentType = response.headers['content-type'];
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error('Error fetching the image:', error);
        throw error;
    }
}


module.exports = {
    getContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact,
    addRandomContacts
};
