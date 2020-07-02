const express = require("express");
const router = express.Router();
const Author = require('../models/author')

router.get('/', (req, res) => {
    res.render('authors/index');
})

// new author
router.get('/new', (req, res) => {
    res.render('authors/new', { author: new Author() })
})

// Create author
router.post('/new', (req, res) => {
    const author = new Author({
        name: req.body.name
    })

    author.save((err, newAuthor) => {
        if (err) {
            res.render('authors/new', {
                author: author,
                errorMessage: "Error creating author"
            })
        } else {
            // res.redirect(`authors/${newAuthor.id}`)
            res.redirect('/');
        }
    });
})

module.exports = router