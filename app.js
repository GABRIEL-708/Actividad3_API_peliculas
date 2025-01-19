const express = require('express');
const mysql = require('mysql2');
const app = express();
app.use(express.json());

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Cambia esto si usas otro usuario
    password: 'luiscc9405', // Cambia esto por tu contraseña
    database: 'films_db'
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

// GET /films - Obtener todas las películas
app.get('/films', (req, res) => {
    connection.query('SELECT * FROM films', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error retrieving films' });
        }
        res.json(results);
    });
});

// GET /films/:id - Obtener una película por su ID
app.get('/films/:id', (req, res) => {
    const filmId = req.params.id;
    connection.query('SELECT * FROM films WHERE id = ?', [filmId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error retrieving film' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Film not found' });
        }
        const film = results[0];

        // Subrecursos: Información relacionada (director y género)
        connection.query('SELECT * FROM films WHERE director = ?', [film.director], (err, directorFilms) => {
            if (err) {
                return res.status(500).json({ error: 'Error retrieving related films' });
            }
            connection.query('SELECT * FROM films WHERE genre = ?', [film.genre], (err, genreFilms) => {
                if (err) {
                    return res.status(500).json({ error: 'Error retrieving related films' });
                }
                res.json({
                    ...film,
                    related: {
                        director: {
                            name: film.director,
                            other_films: directorFilms.map(f => f.title)
                        },
                        genre: {
                            name: film.genre,
                            other_films: genreFilms.map(f => f.title)
                        }
                    }
                });
            });
        });
    });
});

// POST /films - Crear una nueva película
app.post('/films', (req, res) => {
    const { title, director, genre, rating, year } = req.body;
    if (!title || !director || !genre || !rating || !year) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    connection.query(
        'INSERT INTO films (title, director, genre, rating, year) VALUES (?, ?, ?, ?, ?)',
        [title, director, genre, rating, year],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error creating film' });
            }
            res.status(201).json({ id: results.insertId, title, director, genre, rating, year });
        }
    );
});

// PUT /films/:id - Actualizar una película por su ID
app.put('/films/:id', (req, res) => {
    const filmId = req.params.id;
    const { title, director, genre, rating, year } = req.body;
    connection.query(
        'UPDATE films SET title = ?, director = ?, genre = ?, rating = ?, year = ? WHERE id = ?',
        [title, director, genre, rating, year, filmId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error updating film' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Film not found' });
            }
            res.json({ id: filmId, title, director, genre, rating, year });
        }
    );
});

// DELETE /films/:id - Eliminar una película por su ID
app.delete('/films/:id', (req, res) => {
    const filmId = req.params.id;
    connection.query('DELETE FROM films WHERE id = ?', [filmId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting film' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Film not found' });
        }
        res.status(204).send();
    });
});

// Iniciar el servidor
const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});