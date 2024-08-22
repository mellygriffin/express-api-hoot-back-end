// controllers/hoots.js

const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Hoot = require('../models/hoot.js');
const router = express.Router();

// ========== Public Routes ===========

// ========= Protected Routes =========

router.use(verifyToken);

//POST /hoots - Create
router.post('/', async (req, res) => {
    try {
        req.body.author = req.user._id;
        const hoot = await Hoot.create(req.body);
        hoot._doc.author = req.user;
        res.status(201).json(hoot);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

//GET /hoots - Index
router.get('/', async (req, res) => {
    try {
        const hoots = await Hoot.find({})//retrieves all hoots from the database
            .populate('author')//populate author, referencing the in the hoot.js model 
            .sort({ createdAt: 'desc' });//puts hoots in order from most recent to least, 'desc' means descending order
        res.status(200).json(hoots);
    } catch (error) {
        res.status(500).json(error);
    }
});

//GET /hoots/:hootId - Show
router.get('/:hootId', async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId).populate('author');
        res.status(200).json(hoot);
    } catch (error) {
        res.status(500).json(error);
    }
});

//PUT /hoots/:hootId - Update
router.put('/:hootId', async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId)//find the hoot
        if (!hoot.author.equals(req.user._id)) {
            return res.status(403).send("You are not allowed to do that!");//check permissions!
        }
        const updatedHoot = await Hoot.findByIdAndUpdate(
            req.params.hootId,
            req.body,//update hoot
            { new: true }
        );
        updatedHoot._doc.author = req.user;//append req.user to author property
        res.status(200).json(updatedHoot);//issue json response
    } catch (error) {
        res.status(500).json(error);
    }
});

//DELETE /hoots/:hootId - Delete
router.delete('/:hootId', async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        if (!hoot.author.equals(req.user._id)) {
            return res.status(403).send("You're not allowed to do that!");
        }
        const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId);
        res.status(200).json(deletedHoot);
    } catch (error) {
        res.status(500).json(error);
    }
});

//POST /hoots/:hootId/comments - Create Comment
router.post('/:hootId/comments', async (req, res) => {
    try {
        req.body.author = req.user._id;//finding hoot and going to all comments
        const hoot = await Hoot.findById(req.params.hootId);
        hoot.comments.push(req.body);
        await hoot.save();

        const newComment = hoot.comments[hoot.comments.length - 1];
        //find new comment and respond with newComment
        newComment._doc.author = req.user;
        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json(error);
    }
});

//PUT /hoots/:hootId/comments/:commentId - Update Comment
router.put('/:hootId/comments/:commentId', async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        const comment = hoot.comments.id(req.params.commentId);
        comment.text = req.body.text;
        await hoot.save();
        res.status(200).json({ message: 'Ok' });
    } catch(error) {
        res.status(500).json(error);
    }
});

//DELETE /hoots/:hootId/comments/:commentId - Delete Comment
router.delete('/:hootId/comments/:commentId', async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        hoot.comments.remove({ _id: req.params.commentId });
        await hoot.save();
        res.status(200).json({ message: 'Ok' });
    } catch(error) {
        res.status(500).json(error);
    }
});

module.exports = router;
