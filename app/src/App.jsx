import React, { useState, useEffect } from 'react';
import YTSearch from 'youtube-api-search';
import axios from 'axios';
import Spotify from 'spotify-web-api-node';
import './App.css'

// Spotify API Information
const clientID = '5aec34d6bd124f7b8a37a71f7f8cc3c7';
const redirectURI = window.location.protocol + '//' + window.location.host + '/callback';
const AUTHendpoint = 'https://accounts.spotify.com/authorize';
const responseType = 'token';
const authURL = `${AUTHendpoint}?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=${responseType}`;
localStorage.setItem('spotifyAuth', 'signedOut');

// Function to get access token from URL
function getToken(hash) {
    let hashes = hash.split('&');
    let accessToken = hashes[0].replace('#access_token=', '');
    return accessToken;
}

// YouTube API key
const APIkey = 'AIzaSyAt4WZYL5_qoikbwqlNBVpj81d0QDNt0h8';

// Function to search in YouTube API for YouTube videos
function getLinks(playlist) {
    let links = [];

    let promise = new Promise((resolve) => {

        for (let x = 0; x < playlist.length; x++) {
            let songName = playlist[x].name;
            let artistList = [];

            for (let i = 0; i < playlist[x].artists.length; i++) {
                artistList.push(playlist[x].artists[i].name);
            }

            let artists = artistList.join(' ');
            let searchTerm = songName + ' lyrics ' + artists;

            // Actual Search
            YTSearch({ key: APIkey, term: searchTerm, type: 'video', maxResults: 1 }, (videos) => {
                let vid = videos[0];
                let link = `https://www.youtube.com/watch?v=${vid.id.videoId}`;
                links.push(link);

                if (x === playlist.length - 1) {
                    resolve(links);
                }
            });
        }
    });

    return promise;
}

function App() {
    let accessToken = getToken(window.location.hash); // Gets access token

    let [input, setInputValue] = useState('');

    // Search Button Function
    const handleSubmit = (event) => {
        event.preventDefault();

        localStorage.setItem('spotifyAuth', 'signedIn');

        // The link must be a spotify playlist link
        if (input.includes("open.spotify.com/playlist/")) {
            let playlistURL = input;
            let playlistSplitA = playlistURL.split('/')[4];
            let playlistSplitB = playlistSplitA.split('?');
            let playlistID = playlistSplitB[0];
            let playlist = [];

            // The playlist ID is extracted from above, and using the access token, a request is sent
            axios.get(`https://api.spotify.com/v1/playlists/${playlistID}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
                .then(response => {
                    let tracks = response.data.tracks.items;
                    let promiseLinks = [];

                    // Exctracting Names of the Songs
                    tracks.forEach(item => {
                        playlist.push(item.track);
                    });

                    promiseLinks = getLinks(playlist); // Finding YouTube Links

                    promiseLinks.then((youtubeLinks) => {
                        fetch(window.location.protocol + '//' + window.location.hostname + ':3000/download', {
                            method: 'POST',
                            body: JSON.stringify({ youtubeLinks, playlist }),
                            headers: { 'Content-Type': 'application/json' },
                        })
                            .then(res => res.blob())
                            .then(blob => {
                                // Connecting to server.js to download files
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', 'music.zip');
                                document.body.appendChild(link);
                                link.click();
                            })
                            .catch(error => console.error('Error:', error));
                    });
                })
                .catch(error => {
                    console.error("Not a valid playlist");
                });
        }
        else {
            console.log("Be sure to input the playlist link")
        }
    };

    // Spotify Authorization Check
    let [spotifyAuth, authSpotify] = useState(false);
    const spotifyAPI = new Spotify();
    spotifyAPI.setAccessToken(accessToken);

    spotifyAPI.getMe().then(
        (response) => {
            authSpotify(true);
        },
        (error) => {
            console.error('Access token is not working:', error);
        }
    );

    // Spotify Authorization Page redirect
    const login = () => {
        window.location.href = authURL;
    }

    return (
        <div className="contain">

            {!spotifyAuth &&
                <button className='spotifyLogin' onClick={login}>Login to Spotify</button>
            }

            {spotifyAuth &&
                <div className='containForm'>
                    <h1 className='title'>Spotify Playlist MP3 Converter</h1>
                    <h1 className='description'>Turn a Spotify Playlist into MP3 Files</h1>
                    <form className='convertForm' onSubmit={handleSubmit}>
                        <label>
                            <h1 className='message'>i.e. https://open.spotify.com/playlist/...</h1>
                            <input className='inputLink' type="text" value={input} onChange={(event) => setInputValue(event.target.value)} />
                        </label>
                        <br></br><br></br>
                        <input className='submitLink' type="submit" value="Submit" />
                    </form>
                </div>
            }

        </div>
    );
};

export default App;