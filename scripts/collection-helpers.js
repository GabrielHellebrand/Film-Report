// collection-helpers.js - Helper functions for adding movies to collection from box office page
// Using localStorage for compatibility outside Claude.ai environment

(function() {
    'use strict';

    console.log('Collection helpers script loaded');

    // Add movie to user's collection
    window.addToCollection = function(movie) {
        console.log('addToCollection called with movie:', movie);
        
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        console.log('Current user:', currentUser);
        
        if (!currentUser) {
            if (confirm('Please log in to add movies to your collection. Go to My Collection page?')) {
                window.location.href = 'collection.html';
            }
            return;
        }

        try {
            const collectionKey = `collection:${currentUser}`;
            const collectionStr = localStorage.getItem(collectionKey);
            let collection = collectionStr ? JSON.parse(collectionStr) : [];
            console.log('Current collection:', collection);

            // Check if movie already in collection
            const exists = collection.some(m => m.title === movie.title);
            if (exists) {
                alert(`"${movie.title}" is already in your collection!`);
                return;
            }

            // Add movie to collection
            collection.push(movie);
            localStorage.setItem(collectionKey, JSON.stringify(collection));
            console.log('Movie added to collection. New collection:', collection);
            
            alert(`"${movie.title}" added to your collection!`);
        } catch (error) {
            console.error('Add to collection error:', error);
            alert('Failed to add movie to collection: ' + error.message);
        }
    };

    console.log('addToCollection function registered:', typeof window.addToCollection);

})();