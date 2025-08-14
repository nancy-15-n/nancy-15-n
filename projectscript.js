// Enhanced API configuration for more movies
const API_KEY = '41ee980e4b5f05f6693fda00eb7c4fd4';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = "https://image.tmdb.org/t/p/w500";

// DOM elements
const moviesContainer = document.getElementById("movies-container");
const form = document.getElementById("form");
const search = document.getElementById("query");
const loading = document.getElementById("loading");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

// State variables
let currentPage = 1;
let currentQuery = '';
let totalPages = 1;
let allMovies = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadMultiplePages();
    setupEventListeners();
});

function setupEventListeners() {
    form.addEventListener("submit", handleSearch);
    prevPageBtn.addEventListener("click", () => changePage(-1));
    nextPageBtn.addEventListener("click", () => changePage(1));
}

// Load multiple pages to get more movies
async function loadMultiplePages() {
    showLoading();
    
    try {
        // Load first 3 pages to get 60 movies
        const promises = [];
        for (let page = 1; page <= 3; page++) {
            const url = `${BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}&page=${page}`;
            promises.push(fetch(url).then(res => res.json()));
        }
        
        const results = await Promise.all(promises);
        allMovies = results.flatMap(result => result.results || []);
        
        // Also load trending movies
        const trendingUrl = `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`;
        const trendingResponse = await fetch(trendingUrl);
        const trendingData = await trendingResponse.json();
        
        // Combine and deduplicate movies
        const combinedMovies = [...allMovies, ...(trendingData.results || [])];
        const uniqueMovies = combinedMovies.filter((movie, index, self) => 
            index === self.findIndex(m => m.id === movie.id)
        );
        
        displayMovies(uniqueMovies.slice(0, 100)); // Show top 100 movies
        totalPages = Math.ceil(uniqueMovies.length / 20);
        updatePagination();
        
    } catch (error) {
        console.error('Error loading multiple pages:', error);
        loadExtendedSampleMovies();
    } finally {
        hideLoading();
    }
}

async function handleSearch(e) {
    e.preventDefault();
    const searchTerm = search.value.trim();
    if (searchTerm) {
        currentQuery = searchTerm;
        currentPage = 1;
        await searchMovies(searchTerm);
    }
}

async function searchMovies(query) {
    showLoading();
    
    try {
        // Search across multiple pages
        const promises = [];
        for (let page = 1; page <= 5; page++) {
            const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
            promises.push(fetch(url).then(res => res.json()));
        }
        
        const results = await Promise.all(promises);
        const allSearchResults = results.flatMap(result => result.results || []);
        
        displayMovies(allSearchResults);
        totalPages = Math.ceil(allSearchResults.length / 20);
        updatePagination();
        
    } catch (error) {
        console.error('Error searching movies:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function displayMovies(movies) {
    moviesContainer.innerHTML = '';
    
    if (!movies || movies.length === 0) {
        showNoResults();
        return;
    }
    
    // Display all movies at once for better user experience
    movies.forEach(movie => {
        const movieElement = createMovieElement(movie);
        moviesContainer.appendChild(movieElement);
    });
    
    // Update page info
    pageInfo.textContent = `Showing ${movies.length} movies`;
}

function createMovieElement(movie) {
    const movieDiv = document.createElement('div');
    movieDiv.className = 'movie-card';
    
    const posterPath = movie.poster_path 
        ? `${IMG_PATH}${movie.poster_path}`
        : 'https://via.placeholder.com/300x450?text=No+Image';
    
    const releaseYear = movie.release_date 
        ? new Date(movie.release_date).getFullYear() 
        : 'Unknown';
    
    const rating = movie.vote_average 
        ? movie.vote_average.toFixed(1) 
        : 'N/A';
    
    movieDiv.innerHTML = `
        <a href="https://www.themoviedb.org/movie/${movie.id}" target="_blank" rel="noopener noreferrer" class="movie-link">
            <div class="movie-poster">
                <img src="${posterPath}" 
                     alt="${movie.title || 'Movie'} poster"
                     loading="lazy">
                <div class="movie-overlay">
                    <div class="movie-details">
                        <span class="rating">⭐ ${rating}</span>
                        <span class="year">${releaseYear}</span>
                    </div>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title || 'Unknown Title'}</h3>
                <p class="movie-overview">${movie.overview ? movie.overview.substring(0, 150) + '...' : 'No description available'}</p>
                <div class="movie-meta">
                    <span class="rating">⭐ ${rating}</span>
                    <span class="year">${releaseYear}</span>
                </div>
            </div>
        </a>
    `;
    
    return movieDiv;
}

function showLoading() {
    loading.style.display = 'flex';
    moviesContainer.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
    moviesContainer.style.display = 'grid';
}

function showNoResults() {
    moviesContainer.innerHTML = `
        <div class="no-results">
            <i class="fas fa-film"></i>
            <h3>No movies found</h3>
            <p>Try a different search term or check your internet connection</p>
        </div>
    `;
}

function showError(message) {
    moviesContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Movies</h3>
            <p>${message}</p>
            <button onclick="loadExtendedSampleMovies()" class="retry-btn">Show Sample Movies</button>
        </div>
    `;
}

// Extended sample movies for when API fails
function loadExtendedSampleMovies() {
    const extendedSampleMovies = [
        {
            id: 1,
            title: "The Shawshank Redemption",
            poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
            release_date: "1994-09-23",
            vote_average: 8.7,
            overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency."
        },
        {
            id: 2,
            title: "The Godfather",
            poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
            release_date: "1972-03-14",
            vote_average: 8.7,
            overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son."
        },
        {
            id: 3,
            title: "The Dark Knight",
            poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            release_date: "2008-07-16",
            vote_average: 8.5,
            overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice."
        },
        {
            id: 4,
            title: "Pulp Fiction",
            poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
            release_date: "1994-10-14",
            vote_average: 8.5,
            overview: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption."
        },
        {
            id: 5,
            title: "Forrest Gump",
            poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
            release_date: "1994-07-06",
            vote_average: 8.5,
            overview: "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75."
        },
        {
            id: 6,
            title: "Inception",
            poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
            release_date: "2010-07-16",
            vote_average: 8.4,
            overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O."
        },
        {
            id: 7,
            title: "The Matrix",
            poster_path: "/aOiUBRJP3K4tdNOm2Oj2t40WS5W.jpg",
            release_date: "1999-03-31",
            vote_average: 8.4,
            overview: "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers."
        },
        {
            id: 8,
            title: "Goodfellas",
            poster_path: "/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
            release_date: "1990-09-12",
            vote_average: 8.4,
            overview: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners Jimmy Conway and Tommy DeVito."
        },
        {
            id: 9,
            title: "The Lord of the Rings: The Return of the King",
            poster_path: "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
            release_date: "2003-12-17",
            vote_average: 8.4,
            overview: "Gandalf and Aragorn lead the World of Men against Sauron's army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring."
        },
        {
            id: 10,
            title: "Fight Club",
            poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            release_date: "1999-10-15",
            vote_average: 8.4,
            overview: "An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more."
        },
        {
            id: 11,
            title: "Interstellar",
            poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            release_date: "2014-11-07",
            vote_average: 8.3,
            overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival."
        },
        {
            id: 12,
            title: "The Lord of the Rings: The Fellowship of the Ring",
            poster_path: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
            release_date: "2001-12-18",
            vote_average: 8.3,
            overview: "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron."
        },
        {
            id: 13,
            title: "Star Wars: Episode V - The Empire Strikes Back",
            poster_path: "/7BuH8itoSrLExs2YZQ4JiH6ET9B.jpg",
            release_date: "1980-05-20",
            vote_average: 8.3,
            overview: "After the Rebels are brutally overpowered by the Empire on the ice planet Hoth, Luke Skywalker begins Jedi training with Yoda."
        },
        {
            id: 14,
            title: "The Lord of the Rings: The Two Towers",
            poster_path: "/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg",
            release_date: "2002-12-18",
            vote_average: 8.3,
            overview: "While Frodo and Sam edge closer to Mordor with the help of the shifty Gollum, the divided fellowship makes a stand against Sauron's new ally, Saruman."
        },
        {
            id: 15,
            title: "The Silence of the Lambs",
            poster_path: "/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg",
            release_date: "1991-02-14",
            vote_average: 8.3,
            overview: "A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer."
        }
    ];
    
    displayMovies(extendedSampleMovies);
    pageInfo.textContent = `Showing ${extendedSampleMovies.length} sample movies`;
}

// Load more movies on scroll
let isLoadingMore = false;
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 && !isLoadingMore) {
        // Could implement infinite scroll here
    }
});

// Initialize
loadMultiplePages();
