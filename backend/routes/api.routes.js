require("dotenv").config()
const express = require("express");
// const { requireAuth } = require('../middleware/authmiddleware.js')
const Word = require('../models/words.model.js');

const router = express.Router();

async function fetchWordsFromMongoDB (numberOfWords,type){
    try{
        const wordDocument = await Word.findOne({ type })

        if(!wordDocument){
            throw new Error("Invalid type.Words Document not found");
        }

        const wordsArray = wordDocument.names;
        let returdWordsArray = [];
        for(let i = 0;i<numberOfWords;i++){
            let max = wordsArray.length ;
            let randomNumber = Math.floor(Math.random() * (max)) ;
            returdWordsArray[i] = wordsArray[randomNumber];
        }

        return returdWordsArray;

    }
    catch (err){
        console.log("Errror during fetching words in mongo DB. ",err);
        return false;
    }
}

router.get('/fetchwords',async (req,res)=>{

    /// TO ADD MORE WORD IN DATABASE;
    // const randomWords = [
    //     'Amethyst', 'Butterfly', 'Cascade', 'Dolphin', 'Elephant', 'Flamingo', 'Galaxy', 'Harmony', 'Icicle', 'Jasmine',
    //     'Kaleidoscope', 'Lagoon', 'Mermaid', 'Nightingale', 'Orchid', 'Paradox', 'Quasar', 'Rainbow', 'Sapphire', 'Tornado',
    //     'Utopia', 'Vortex', 'Whisper', 'Xanadu', 'Yin Yang', 'Zephyr', 'Anchor', 'Balloon', 'Cactus', 'Dolphin',
    //     'Eagle', 'Fountain', 'Giraffe', 'Hammock', 'Igloo', 'Jigsaw', 'Kangaroo', 'Lighthouse', 'Magnet', 'Necklace', 'Oasis',
    //     'Palette', 'Quill', 'Raindrop', 'Seashell', 'Telescope', 'Umbrella', 'Vase', 'Whistle', 'Xylophone', 'Yo-yo', 'Zigzag',
    //     'Arrow', 'Book', 'Camera', 'Dice', 'Eggplant', 'Feather', 'Guitar', 'Helmet', 'Ink', 'Jug',
    //     'Kite', 'Lamp', 'Mask', 'Notebook', 'Oar', 'Pencil', 'Quilt', 'Ruler', 'Sunglasses', 'Tape',
    //     'Umbrella', 'Violin', 'Wallet', 'X-ray', 'Yarn', 'Zebra', 'Axe', 'Basket', 'Coat', 'Drum',
    //     'Easel', 'Flute', 'Guitar', 'Harp', 'Inkwell', 'Jug', 'Kettle', 'Lantern', 'Mop', 'Net',
    //     'Oven', 'Paddle', 'Quiver', 'Rope', 'Skateboard', 'Tent', 'Ukelele', 'Violin', 'Wig', 'Xylophone',
    //     'Yoyo', 'Zither', 'Antenna', 'Bottle', 'Chest', 'Diary', 'Earrings', 'Flag', 'Goggles', 'Hammock',
    //     'Icebox', 'Jacket', 'Keyboard', 'Luggage', 'Microscope', 'Nail', 'Opal', 'Puzzle', 'Quill', 'Ribbon'
    //   ];
      
    // // http://localhost:3000/api/fetchwords
    // const test = Word.create({type:"random4",names : randomWords});
      
    const { noOfWords , type } = req.query;
    console.log( { noOfWords , type } )
    // const noOfWords = 5
    // const type = 'random'

    if(!noOfWords || noOfWords === 'undefined'){
        return res.status(400).json({ error : "bad request" , message : "no of words parameter is required"});
    }

    if(!type){
        return res.status(400).json({ error : "bad request" , message : "type parameter is required"});
    }

    const parsedNoOfWords = Number.parseInt(noOfWords, 10);

    if(isNaN(parsedNoOfWords) || parsedNoOfWords > 5){
        return res.status(400).json({ error : "bad request" , message : "noOfwords is NaN"});
    }

    const returnWordsArray = await fetchWordsFromMongoDB(noOfWords,type);

    if(!returnWordsArray){
        return res.status(500).json({message : "Internal server error."})
    }

    return res.send(returnWordsArray);
   
})


module.exports = router;