const express = require('express'); // Routing
const ytdl = require('ytdl-core'); // To Download YouTube Links
const bodyParser = require('body-parser'); // For extracting data and have access to it
const cors = require('cors'); // Enable CORS policy
const archiver = require('archiver'); // For downloading zip files
const fs = require('fs'); // File system operations
const http = require('http'); // For creating HTTP client

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Remember to use npm run dev to launch both back-end and front-end

/* ----- Redirect to downloading MP3 Files from YouTube ---- */
app.post('/download', (req, res) => {

    console.log("Download route hit");

    // Gathering Information from React
    let youtubeLinks = req.body.youtubeLinks;
    let songInfo = req.body.playlist;

    console.log("Number of Songs: " + youtubeLinks.length);

    // If there aren't any YouTube links, there is an error
    if (!youtubeLinks) {
        return res.status(400).send({ error: 'No array was sent' });
    }

    // Creating the name of the file [Song - Artist(s)]
    let fileNames = [];

    for (let x = 0; x < songInfo.length; x++) {
        let songName = songInfo[x].name;
        let songArtists = [];

        for (let i = 0; i < songInfo[x].artists.length; i++) {
            songArtists.push(songInfo[x].artists[i].name);
            console.log()
        }

        let artists = songArtists.join(', ');
        let file = songName + ' - ' + artists;
        fileNames.push(file);
    }

    // Adjusting Compression Level
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    res.attachment('music.zip'); // Sets HTTP response and zip file name

    // Information when archiver closes
    archive.on('close', () => {
        console.log(archive.pointer() + ' total bytes');
        console.log('Archiver has been finalized and the output file descriptor has closed');
    });

    // If archiver encounters an error
    archive.on('error', (err) => {
        throw err;
    });

    // Archiver sends to client
    archive.pipe(res);

    // YouTube Download Settings
    const options = {
        quality: 'highest',
        filter: 'audioonly',
        format: 'mp3'
    }

    console.log(fileNames);
    console.log("To Download:")

    // Adding YouTube MP3 files in the zip file
    for (let i = 0; i < youtubeLinks.length; i++) {
        let file = ytdl(youtubeLinks[i], options);
        archive.append(file, { name: `${fileNames[i]}.mp3` });
        console.log(fileNames[i]);
        i++;
    }

    archive.finalize();
});

// Run Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server started on port ${ PORT }`));