const apiKey = "e631858d"

let allMoviesArray = []
let watchlistArray = []

const searchInputEl = document.getElementById("search-input")
const formEl = document.getElementById("form")
const moviesContainerEl = document.getElementById("movies-container")
const addedMsgEl = document.getElementById('added-msg')

formEl.addEventListener("submit", async function(e) {
    e.preventDefault()

    let moviesArray = []

    //Getting the result of searched film
    const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${searchInputEl.value}`)
    const data = await response.json()

    moviesArray = data.Search

    if (data.Response === "True") {
        getMoviesInfo(moviesArray)
    }else {
        moviesContainerEl.innerHTML = `
            <div class="not-found-container">
               <p class="not-found">Unable To Find What You’re Looking For.<br>Please Try Another Search.
            </div>
        `
    }
    searchInputEl.value = ""
});

// Lister for add movie in localStorage
moviesContainerEl.addEventListener("click", function(e) {
    if (e.target.dataset.addMovie) {
        let found=false
        watchlistArray.forEach(movie => {
            if(e.target.dataset.addMovie === movie.imdbID) {
                found=true
            }
        });
        if(found === false) {
            const foundFilm = allMoviesArray.find((movie) => movie.imdbID === e.target.dataset.addMovie)
            watchlistArray.push(foundFilm)
            localStorage.setItem('id', JSON.stringify(watchlistArray))
            addedMsgEl.classList.toggle('added')
            addedMsgEl.innerText = 'Film Added To Your Watchlist'
            setTimeout(() => {
                addedMsgEl.classList.toggle("added")
            }, 3000)

        }else {
            addedMsgEl.classList.toggle("added")
            addedMsgEl.innerText = 'Film Already In Watchlist'
            setTimeout(() => {
                addedMsgEl.classList.toggle("added")
            }, 3000)
        }
    }
})

async function getMoviesInfo(arr) {
    let moviesInfoArray = []

    // fetching the movies with full info, pushing all the info in the array and calling
    // render function passing this array
    arr.map(async (movie) => {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${movie.imdbID}`)
        const data = await response.json()
        moviesInfoArray.push(data)

        renderHtml(moviesInfoArray)
    });

    console.log(moviesInfoArray)
    allMoviesArray = moviesInfoArray
}

function renderHtml(arr) {
    let html = ""

    arr.map(movie => {
        const {
            Poster,
            Title,
            Ratings,
            Runtime,
            Genre,
            Plot,
            imdbID
        } = movie

        html += `
            <div class="movie">
                <img src="${Poster}" class="poster" />
                <div class="movie-details-container">
                    <div class="movie-title">
                        <h2>${Title}</h2>
                        <p class="ratings">⭐ ${Ratings[0].Value}</p>
                    </div>
                    
                    <div class="info-container">
                        <div id="info" class="info">
                            <p>${Runtime}</p>
                            <p>${Genre}</p>
                            <p class="watchlist fa-solid fa-circle-plus" data-add-movie="${imdbID}"> Watchlist</p>
                        </div>

                        <div class="plot">
                            <p>${Plot}</p>
                        </div>
                    </div>
                </div>
            </div>
        `
    }).join('')

    moviesContainerEl.innerHTML = html
}