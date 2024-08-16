let watchlistArr = []

const watchListEl = document.getElementById("watchlist-container")

watchListEl.addEventListener('click', (e) => {
    if(e.target.dataset.removeMovie) {
        let found = false
        watchlistArr.forEach(movieToRemove => {
            if(movieToRemove.imdbID === e.target.dataset.removeMovie) {
                found = true
                watchlistArr.splice(movieToRemove, 1)
                localStorage.setItem("id", JSON.stringify(watchlistArr))
                getMoviesFromLocalStorage()
            }
        })
        if(watchlistArr.length === 0) {
            watchListEl.innerHTML = `
                    <i class="fa-solid fa-film"></i>
                    <h2>Your watchlist is empty...</h2>
            `
        }
    }
})

// get movies from local storage
function getMoviesFromLocalStorage() {
    let moviesFromLocalStorage = JSON.parse(localStorage.getItem("id"))
    watchlistArr = moviesFromLocalStorage
    if (moviesFromLocalStorage.length) {
        renderHtml(watchlistArr)
    }
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
                            <p class="watchlist fa-solid fa-circle-minus" data-remove-movie="${imdbID}"> Watchlist</p>
                        </div>

                        <div class="plot">
                            <p>${Plot}</p>
                        </div>
                    </div>
                </div>
            </div>
        `
    }).join('')

    watchListEl.innerHTML = html
}

getMoviesFromLocalStorage()