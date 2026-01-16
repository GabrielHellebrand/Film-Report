// recommendations.js - Movie recommendation engine

(function() {
    'use strict';

    let currentUser = null;
    let allMovies = {};
    let recommendations = [];
    let currentFilter = 'all';

    // Load movie data
    async function loadMovieData() {
        try {
            const response = await fetch('./data/movies.json');
            allMovies = await response.json();
            return allMovies;
        } catch (error) {
            console.error('Failed to load movie data:', error);
            return {};
        }
    }

    // Initialize
    async function init() {
        currentUser = localStorage.getItem('currentUser');
        
        if (!currentUser) {
            document.getElementById('authRequired').classList.remove('hidden');
            document.getElementById('recommendationsSection').classList.add('hidden');
            return;
        }

        document.getElementById('authRequired').classList.add('hidden');
        document.getElementById('recommendationsSection').classList.remove('hidden');
        document.getElementById('currentUsername').textContent = currentUser;

        // Set up filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.rating;
                displayRecommendations();
            });
        });

        // Load data and generate recommendations
        await loadMovieData();
        await generateRecommendations();
    }

    // Generate recommendations based on user's collection and ratings
    async function generateRecommendations() {
        const collection = getUserCollection();
        const userReviews = await getUserReviews();
        
        if (collection.length === 0) {
            document.getElementById('noRecommendations').classList.remove('hidden');
            document.getElementById('recommendationsGrid').innerHTML = '';
            return;
        }

        // Analyze user preferences
        const preferences = analyzePreferences(collection, userReviews);
        
        // Score all movies not in collection
        const scoredMovies = [];
        
        for (let movieTitle in allMovies) {
            // Skip if already in collection
            if (collection.some(m => m.title === movieTitle)) continue;
            
            const score = calculateMovieScore(movieTitle, preferences, userReviews);
            
            if (score.totalScore > 0) {
                scoredMovies.push({
                    title: movieTitle,
                    ...allMovies[movieTitle],
                    score: score.totalScore,
                    reasons: score.reasons
                });
            }
        }

        // Sort by score
        recommendations = scoredMovies.sort((a, b) => b.score - a.score);
        
        displayRecommendations();
    }

    // Analyze user preferences from collection and reviews
    function analyzePreferences(collection, userReviews) {
        const preferences = {
            ratings: {},
            averageRuntime: 0,
            highlyRatedMovies: []
        };

        // Analyze MPAA ratings
        collection.forEach(movie => {
            const rating = allMovies[movie.title]?.rating || 'Unknown';
            preferences.ratings[rating] = (preferences.ratings[rating] || 0) + 1;
        });

        // Calculate average runtime
        const runtimes = collection
            .map(m => allMovies[m.title]?.runtime)
            .filter(r => r);
        preferences.averageRuntime = runtimes.length > 0 
            ? runtimes.reduce((a, b) => a + b, 0) / runtimes.length 
            : 0;

        // Find highly rated movies (4+ stars)
        userReviews.forEach(review => {
            if (review.rating >= 4) {
                preferences.highlyRatedMovies.push(review.movieTitle);
            }
        });

        return preferences;
    }

    // Calculate recommendation score for a movie
    function calculateMovieScore(movieTitle, preferences, userReviews) {
        let score = 0;
        const reasons = [];
        const movieData = allMovies[movieTitle];

        if (!movieData) return { totalScore: 0, reasons: [] };

        // Score based on MPAA rating preference
        const movieRating = movieData.rating;
        if (preferences.ratings[movieRating]) {
            const ratingScore = preferences.ratings[movieRating] * 20;
            score += ratingScore;
            reasons.push(`Matches your preferred ${movieRating} rating`);
        }

        // Score based on runtime similarity
        if (preferences.averageRuntime > 0 && movieData.runtime) {
            const runtimeDiff = Math.abs(movieData.runtime - preferences.averageRuntime);
            if (runtimeDiff < 20) {
                score += 30;
                reasons.push('Similar runtime to your favorites');
            } else if (runtimeDiff < 40) {
                score += 15;
            }
        }

        // Boost if other users who liked same movies also liked this
        const collaborativeScore = getCollaborativeScore(movieTitle, preferences.highlyRatedMovies);
        if (collaborativeScore > 0) {
            score += collaborativeScore;
            reasons.push('Liked by users with similar taste');
        }

        // Small random factor for variety
        score += Math.random() * 5;

        return { totalScore: score, reasons };
    }

    // Get collaborative filtering score
    function getCollaborativeScore(movieTitle, userHighlyRated) {
        if (userHighlyRated.length === 0) return 0;

        let score = 0;
        
        // Check all reviews for this movie
        const reviewsKey = `reviews:${movieTitle}`;
        const reviewsStr = localStorage.getItem(reviewsKey);
        
        if (!reviewsStr) return 0;

        try {
            const reviews = JSON.parse(reviewsStr);
            
            reviews.forEach(review => {
                if (review.rating >= 4) {
                    // Check if this reviewer also liked movies the user liked
                    const reviewerLikes = getUserHighlyRatedMovies(review.username);
                    const overlap = reviewerLikes.filter(title => 
                        userHighlyRated.includes(title)
                    ).length;
                    
                    if (overlap > 0) {
                        score += overlap * 15;
                    }
                }
            });
        } catch (e) {
            return 0;
        }

        return Math.min(score, 50); // Cap collaborative score
    }

    // Get highly rated movies for a user
    function getUserHighlyRatedMovies(username) {
        const highlyRated = [];
        
        // Check all movie reviews
        for (let key in localStorage) {
            if (key.startsWith('reviews:')) {
                try {
                    const reviews = JSON.parse(localStorage.getItem(key));
                    const movieTitle = key.replace('reviews:', '');
                    
                    reviews.forEach(review => {
                        if (review.username === username && review.rating >= 4) {
                            highlyRated.push(movieTitle);
                        }
                    });
                } catch (e) {
                    continue;
                }
            }
        }
        
        return highlyRated;
    }

    // Get user's reviews
    async function getUserReviews() {
        const reviews = [];
        
        for (let key in localStorage) {
            if (key.startsWith('reviews:')) {
                try {
                    const movieReviews = JSON.parse(localStorage.getItem(key));
                    const movieTitle = key.replace('reviews:', '');
                    
                    movieReviews.forEach(review => {
                        if (review.username === currentUser) {
                            reviews.push({
                                movieTitle: movieTitle,
                                ...review
                            });
                        }
                    });
                } catch (e) {
                    continue;
                }
            }
        }
        
        return reviews;
    }

    // Get user's collection
    function getUserCollection() {
        const collectionKey = `collection:${currentUser}`;
        const collectionStr = localStorage.getItem(collectionKey);
        return collectionStr ? JSON.parse(collectionStr) : [];
    }

    // Display recommendations
    function displayRecommendations() {
        const grid = document.getElementById('recommendationsGrid');
        const noRecs = document.getElementById('noRecommendations');

        // Filter by rating
        let filteredRecs = recommendations;
        if (currentFilter !== 'all') {
            filteredRecs = recommendations.filter(movie => 
                movie.rating === currentFilter
            );
        }

        if (filteredRecs.length === 0) {
            grid.innerHTML = '';
            noRecs.classList.remove('hidden');
            return;
        }

        noRecs.classList.add('hidden');

        // Show top 12 recommendations
        const topRecs = filteredRecs.slice(0, 12);

        grid.innerHTML = topRecs.map(movie => {
            const posterSrc = `./images/${movie.title}.png`;
            const matchPercent = Math.min(100, Math.round(movie.score));
            
            return `
                <div class="recommendation-card">
                    <div class="recommendation-score">
                        ${matchPercent}% Match
                    </div>
                    <img src="${posterSrc}" alt="${movie.title}" style="width: 100%; height: 300px; object-fit: cover;">
                    <div class="movie-card-info">
                        <div class="movie-card-title">${movie.title}</div>
                        <div style="color: #ffd700; font-size: 12px; margin: 5px 0;">
                            ${movie.rating || 'NR'} • ${movie.runtime ? movie.runtime + ' min' : 'Runtime unknown'}
                        </div>
                        <div class="recommendation-reasons">
                            <strong>Why recommended:</strong>
                            <ul>
                                ${movie.reasons.slice(0, 3).map(reason => 
                                    `<li>• ${reason}</li>`
                                ).join('')}
                            </ul>
                        </div>
                        <button class="btn" onclick="addToCollection('${movie.title.replace(/'/g, "\\'")}')">
                            Add to Collection
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Add movie to collection
    window.addToCollection = function(movieTitle) {
        if (!currentUser) {
            alert('Please log in first');
            return;
        }

        try {
            const collectionKey = `collection:${currentUser}`;
            const collectionStr = localStorage.getItem(collectionKey);
            let collection = collectionStr ? JSON.parse(collectionStr) : [];

            // Check if already in collection
            if (collection.some(m => m.title === movieTitle)) {
                alert(`"${movieTitle}" is already in your collection!`);
                return;
            }

            // Add movie
            collection.push({
                title: movieTitle,
                poster: `./images/${movieTitle}.png`
            });

            localStorage.setItem(collectionKey, JSON.stringify(collection));
            alert(`"${movieTitle}" added to your collection!`);

            // Refresh recommendations
            generateRecommendations();
        } catch (error) {
            console.error('Add to collection error:', error);
            alert('Failed to add movie to collection');
        }
    };

    // Logout
    window.handleLogout = function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'collection.html';
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();