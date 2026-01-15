// main.js - cleaned, index-driven loader and renderer for Film Report
(function(){
  'use strict';

  // Guard against the script running twice (helps avoid duplicate rendering)
  if(typeof window !== 'undefined' && window.__filmReportInit){
    console.warn('FilmReport: script already initialized, skipping duplicate run.');
    return;
  }
  if(typeof window !== 'undefined') window.__filmReportInit = true;

  // DOM refs - will be initialized in boot()
  var box = null;
  var ul = null;
  var weekPicker = null;
  var prevBtn = null;
  var nextBtn = null;
  var weekLabel = null;

  var WEEK_KEY = 'filmreport_selected_week';

  // Movie data lookup - will be loaded from movies.json
  var movieMap = null;
  var runtimeLookup = {};
  var mpaaLookup = {};

  function normalizeTitle(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }

  // Function to load movies.json
  function loadMovieData(){
    return fetch('./data/movies.json')
      .then(function(res){
        if(!res.ok) throw new Error('movies.json fetch failed');
        return res.json();
      })
      .then(function(data){
        movieMap = data;
        // Build normalized lookup maps
        for(var key in movieMap){
          if(movieMap.hasOwnProperty(key)){
            var normalized = normalizeTitle(key);
            var movieData = movieMap[key];
            if(movieData.runtime) runtimeLookup[normalized] = movieData.runtime;
            if(movieData.rating) mpaaLookup[normalized] = movieData.rating;
          }
        }
        return movieMap;
      });
  }

  function pad2(n){ return n < 10 ? '0' + n : String(n); }

  function toIsoDate(d){
    return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate());
  }

  function parseIsoDate(iso){
    var parts = String(iso).split('-');
    return new Date(parseInt(parts[0],10)||0, (parseInt(parts[1],10)||1)-1, parseInt(parts[2],10)||1);
  }

  function formatRuntime(mins){ if(!mins || isNaN(mins)) return '\u2014'; var h=Math.floor(mins/60); var m=mins%60; return h + 'hr ' + pad2(m) + 'mins'; }

  function clearPosters(){ if(!ul) return; ul.innerHTML = ''; }

  function createMovieItem(movie, position){
    var li = document.createElement('li');

    var posterWrapper = document.createElement('div');
    posterWrapper.className = 'poster-wrapper';

    var nowShowing = document.createElement('div');
    nowShowing.className = 'poster-now-showing';
    nowShowing.textContent = 'NOW SHOWING';
    posterWrapper.appendChild(nowShowing);

    var img = document.createElement('img');
    img.alt = movie.title || '';
    img.src = movie.poster || ('./images/' + (movie.title || 'no-art') + '.png');
    posterWrapper.appendChild(img);

    // Create overlay for hover info
    var overlay = document.createElement('div'); 
    overlay.className = 'hover-overlay';

    var title = document.createElement('div'); 
    title.className = 'overlay-title'; 
    title.textContent = movie.title || '';
    overlay.appendChild(title);
    
    // Get normalized key for lookups
    var key = normalizeTitle(movie.title || '');
    
    // Runtime
    var runtime = runtimeLookup.hasOwnProperty(key) ? formatRuntime(runtimeLookup[key]) : '\u2014';
    var runtimeDiv = document.createElement('div');
    runtimeDiv.className = 'overlay-line';
    runtimeDiv.innerHTML = '<strong>Runtime:</strong> ' + runtime;
    overlay.appendChild(runtimeDiv);
      
    // Rating
    var movieRating = movie.rating || (mpaaLookup.hasOwnProperty(key) ? mpaaLookup[key] : null);
    if(movieRating){
      var ratingDiv = document.createElement('div');
      ratingDiv.className = 'overlay-line';
      ratingDiv.innerHTML = '<strong>Rating:</strong> ' + movieRating;
      overlay.appendChild(ratingDiv);
    }
    
    // Theaters
    if(movie.theaters){
      var theatersDiv = document.createElement('div');
      theatersDiv.className = 'overlay-line';
      theatersDiv.innerHTML = '<strong>Theaters:</strong> ' + movie.theaters;
      overlay.appendChild(theatersDiv);
    }
    
    // Weekend Gross
    if(movie.gross){
      var grossDiv = document.createElement('div');
      grossDiv.className = 'overlay-line';
      grossDiv.innerHTML = '<strong>Weekend:</strong> ' + movie.gross;
      overlay.appendChild(grossDiv);
    }
    
    // Total Gross
    if(movie.totalGross){
      var totalDiv = document.createElement('div');
      totalDiv.className = 'overlay-line';
      totalDiv.innerHTML = '<strong>Total:</strong> ' + movie.totalGross;
      overlay.appendChild(totalDiv);
    }
    
    posterWrapper.appendChild(overlay);
    li.appendChild(posterWrapper);
    
    return li;
  }

  // Function to add "Now Showing" header for grid view
  function addNowShowingHeader(){
    
  }

  function generateShowtimes(runtime, position){
    if(!runtime || isNaN(runtime)) return [];
    var showtimes = [];
    
    // Screen allocation rules based on position (1-indexed)
    var screensAllocated;
    if(position <= 3){
      screensAllocated = 3; // #1-3 get 3 screens
    } else if(position <= 6){
      screensAllocated = 2; // #4-6 get 2 screens
    } else if(position <= 12){
      screensAllocated = 1; // #7-12 get 1 screen
    } else if(position <= 16){
      screensAllocated = 0.5; // #13-16 get 1/2 screen
    } else if(position <= 20){
      screensAllocated = 0.25; // #17-20 get 1/4 screen
    } else {
      screensAllocated = 0.25; // default for beyond position 20
    }
    
    // Time calculations
    var preshow = 2;
    var previews = Math.round(runtime * 0.10);
    var cleaning = 20;
    var totalShowDuration = preshow + previews + runtime + cleaning;
    
    var startTime = 11 * 60; // 11 AM
    var latestShowtimeStart = 23 * 60; // 11 PM
    
    var allTimes = [];
    
    // Generate times per screen
    var numScreens = Math.ceil(screensAllocated);
    for(var screen = 0; screen < numScreens; screen++){
      var currentTime = startTime;

      // Randomize first showtime between 11:00 AM and 1:00 PM (0–120 min)
      var randomOffset = Math.floor(Math.random() * 120);
      currentTime += randomOffset;

      // Stagger other screens further
      if(screen > 0){
        var stagger = 15 + (screen * 20);
        currentTime += stagger;
      }

      // Only enforce the start-time window (11 AM → 11 PM)
      while(currentTime <= latestShowtimeStart){
        allTimes.push(currentTime);
        currentTime += totalShowDuration;
      }
    }
    
    // Sort & remove near-duplicates within 10 minutes
    allTimes.sort(function(a, b){ return a - b; });
    var uniqueTimes = [];
    for(var i = 0; i < allTimes.length; i++){
      var isDuplicate = false;
      for(var j = 0; j < uniqueTimes.length; j++){
        if(Math.abs(allTimes[i] - uniqueTimes[j]) < 10){
          isDuplicate = true;
          break;
        }
      }
      if(!isDuplicate){
        uniqueTimes.push(allTimes[i]);
      }
    }
    
    // For fractional screens, limit the number of showtimes
    if(screensAllocated < 1){
      var maxShowtimes = Math.max(1, Math.ceil(uniqueTimes.length * screensAllocated));
      uniqueTimes = uniqueTimes.slice(0, maxShowtimes);
    }
    
    // Convert minutes → formatted time (e.g., "12:45 PM")
    for(var i = 0; i < uniqueTimes.length; i++){
      var totalMinutes = uniqueTimes[i];
      var hour = Math.floor(totalMinutes / 60);
      var minute = totalMinutes % 60;
      var period = hour >= 12 ? 'PM' : 'AM';
      var displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      showtimes.push(displayHour + ':' + pad2(minute) + ' ' + period);
    }
    
    return showtimes;
  }

  function createMarqueeItem(movie, position){
    var li = document.createElement('li');
    li.className = 'marquee-item';

    // Container for all movie info
    var infoDiv = document.createElement('div');
    infoDiv.className = 'marquee-info';

    // Title + Rating (on same line) - Runtime removed
    var titleRatingDiv = document.createElement('div');
    titleRatingDiv.className = 'marquee-title-rating';
    var titleText = movie.title || '';
    var key = normalizeTitle(movie.title || '');
    var movieRating = movie.rating || (mpaaLookup.hasOwnProperty(key) ? mpaaLookup[key] : null);
    
    if(movieRating) titleText += ' • ' + movieRating;
    
    titleRatingDiv.textContent = titleText;
    infoDiv.appendChild(titleRatingDiv);

    // Showtimes (next row)
    var runtime = runtimeLookup.hasOwnProperty(key) ? runtimeLookup[key] : null;
    if(runtime){
        var showtimes = generateShowtimes(runtime, position);
        var showtimesDiv = document.createElement('div');
        showtimesDiv.className = 'marquee-showtimes';

        for(var i = 0; i < showtimes.length; i++){
            var timeSpan = document.createElement('span');
            timeSpan.className = 'showtime';
            timeSpan.textContent = showtimes[i];
            showtimesDiv.appendChild(timeSpan);
        }

        infoDiv.appendChild(showtimesDiv);
    }

    li.appendChild(infoDiv);
    return li;
  }

  // View variables
  var allMovies = [];
  var currentView = 'grid'; // 'grid' or 'marquee'
  var currentCarouselIndex = 0;
  var moviesPerPage = 4;
  
  function renderFromArray(movies){ 
    console.log('renderFromArray called with', movies.length, 'movies');
    allMovies = movies;
    currentCarouselIndex = 0; // Reset carousel position
    if(currentView === 'grid'){
      updateGrid();
    } else {
      updateMarquee();
    }
  }
  
  function updateGrid(){
    console.log('updateGrid called, ul exists:', !!ul, 'box exists:', !!box);
    clearPosters(); 
    if(!ul) {
      console.error('updateGrid: ul is null!');
      return;
    }
    console.log('Cleared posters, building grid...');
    
    // Remove marquee class if present
    if(ul.classList) ul.classList.remove('marquee-view');
    
    // Remove marquee header if present
    var existingHeader = box && box.querySelector('.marquee-header');
    if(existingHeader) existingHeader.remove();
    
    // Remove existing carousel container if present
    var existingCarousel = box && box.querySelector('.carousel-container');
    if(existingCarousel) existingCarousel.remove();
    
    // Add "Now Showing" header
    addNowShowingHeader();
    
    // Create carousel container
    var carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container';
    
    // Create left arrow
    var leftArrow = document.createElement('button');
    leftArrow.className = 'carousel-arrow left';
    leftArrow.innerHTML = '‹';
    leftArrow.onclick = function(){ navigateCarousel(-1); };
    carouselContainer.appendChild(leftArrow);
    
    // Move ul into carousel container (use `box` as the canonical container)
    if(ul.parentNode) ul.parentNode.removeChild(ul);
    carouselContainer.appendChild(ul);
    
    // Create right arrow
    var rightArrow = document.createElement('button');
    rightArrow.className = 'carousel-arrow right';
    rightArrow.innerHTML = '›';
    rightArrow.onclick = function(){ navigateCarousel(1); };
    carouselContainer.appendChild(rightArrow);
    
    // Add carousel to the main box container
    if(box) box.appendChild(carouselContainer);
    
    // Display first 20 movies, but only show 4 at a time
    var maxMovies = Math.min(20, allMovies.length);
    console.log('Creating', maxMovies, 'movie items');
    
    for(var i = 0; i < maxMovies; i++){
      var li = createMovieItem(allMovies[i], i + 1);
      if(i >= moviesPerPage){
        li.style.display = 'none';
      }
      ul.appendChild(li);
    }
    console.log('Movie items added to ul, ul.children.length:', ul.children.length);
    
    // Update arrow visibility
    updateCarouselArrows();
  }
  
  function navigateCarousel(direction){
    if(!ul) return;
    
    var maxMovies = Math.min(20, allMovies.length);
    var maxIndex = Math.max(0, maxMovies - moviesPerPage);
    
    currentCarouselIndex += direction * moviesPerPage;
    
    // Clamp index
    if(currentCarouselIndex < 0) currentCarouselIndex = 0;
    if(currentCarouselIndex > maxIndex) currentCarouselIndex = maxIndex;
    
    // Show/hide movies based on current index
    var items = ul.querySelectorAll('li');
    for(var i = 0; i < items.length; i++){
      if(i >= currentCarouselIndex && i < currentCarouselIndex + moviesPerPage){
        items[i].style.display = '';
      } else {
        items[i].style.display = 'none';
      }
    }
    
    updateCarouselArrows();
  }
  
  function updateCarouselArrows(){
    var leftArrow = document.querySelector('.carousel-arrow.left');
    var rightArrow = document.querySelector('.carousel-arrow.right');
    
    if(leftArrow){
      leftArrow.style.opacity = currentCarouselIndex === 0 ? '0.3' : '1';
      leftArrow.style.cursor = currentCarouselIndex === 0 ? 'default' : 'pointer';
    }
    
    var maxMovies = Math.min(20, allMovies.length);
    var maxIndex = Math.max(0, maxMovies - moviesPerPage);
    
    if(rightArrow){
      rightArrow.style.opacity = currentCarouselIndex >= maxIndex ? '0.3' : '1';
      rightArrow.style.cursor = currentCarouselIndex >= maxIndex ? 'default' : 'pointer';
    }
  }
  
  function updateMarquee(){
    clearPosters();
    if(!ul) return;
    
    // Remove carousel container if present and restore `ul` into `box`
    var existingCarousel = box && box.querySelector('.carousel-container');
    if(existingCarousel){
      if(existingCarousel.parentNode) existingCarousel.parentNode.removeChild(existingCarousel);
      if(box) box.appendChild(ul);
    }
    
    // Add marquee class
    if(ul.classList) ul.classList.add('marquee-view');
    
    // Add Hellebrand Cinemas header as a marquee list item if not already present
    var existingHeaderLi = ul && ul.querySelector('li.marquee-header-item');
    if(!existingHeaderLi && ul){
      var headerLi = document.createElement('li');
      headerLi.className = 'marquee-item marquee-header-item';
      var headerDiv = document.createElement('div');
      headerDiv.className = 'marquee-header';
      headerDiv.textContent = 'Hellebrand Cinemas 24';
      headerLi.appendChild(headerDiv);
      // Insert as the first child of the marquee <ul> so it spans above columns
      if(ul.firstChild){
        ul.insertBefore(headerLi, ul.firstChild);
      } else {
        ul.appendChild(headerLi);
      }
    }
    
    // Show all 20 movies in marquee view
    var maxMovies = Math.min(20, allMovies.length);
    for(var i = 0; i < maxMovies; i++){
      ul.appendChild(createMarqueeItem(allMovies[i], i + 1));
    }
  }
  
  function toggleView(){
    currentView = currentView === 'grid' ? 'marquee' : 'grid';
    if(currentView === 'grid'){
      updateGrid();
    } else {
      updateMarquee();
    }
    
    // Update button text
    var toggleBtn = document.getElementById('toggleView');
    if(toggleBtn){
      toggleBtn.textContent = currentView === 'grid' ? 'Marquee View' : 'Grid View';
    }
  }

  var availableWeeks = null;
  function loadIndex(){ return fetch('./data/index.json').then(function(res){ if(!res.ok) throw new Error('index fetch failed'); return res.json(); }).then(function(j){ availableWeeks = (j && j.weeks) ? j.weeks : []; return availableWeeks; }); }
  function loadWeekendJson(iso){ return fetch('./data/' + iso + '.json').then(function(res){ if(!res.ok) throw new Error('week fetch failed'); return res.json(); }); }
  function formatWeekLabel(d){ if(!d) return ''; return d.toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'}); }

  function loadAndRenderWeekend(iso){ if(!iso) return Promise.resolve(); if(weekLabel){ weekLabel.textContent = iso; weekLabel.setAttribute('data-week', iso); } return loadWeekendJson(iso).then(function(j){ renderFromArray((j && j.movies) ? j.movies : []); if(weekLabel) weekLabel.textContent = formatWeekLabel(parseIsoDate(iso)); }); }

  function setSelectedWeek(d){ if(!d) return; var iso = toIsoDate(d); try{ localStorage.setItem(WEEK_KEY, iso); }catch(e){} if(weekPicker) weekPicker.value = iso; if(weekLabel) weekLabel.setAttribute('data-week', iso); }

  function indexOf(arr,val){ if(!arr) return -1; for(var i=0;i<arr.length;i++){ if(arr[i]===val) return i; } return -1; }

  function changeWeekBy(days){
    var currentIso = weekPicker && weekPicker.value ? weekPicker.value : (weekLabel && weekLabel.getAttribute('data-week') ? weekLabel.getAttribute('data-week') : toIsoDate(new Date()));
    var current = parseIsoDate(currentIso);
    var n = new Date(current.getTime()); n.setDate(n.getDate()+days);
    var anchor = parseIsoDate('1997-08-22');
    var daysSince = Math.round((n-anchor)/(1000*60*60*24));
    var weeks = Math.round(daysSince/7);
    var snapped = new Date(anchor.getTime()); snapped.setDate(anchor.getDate() + (weeks*7));
    setSelectedWeek(snapped);
    var snappedIso = toIsoDate(snapped);
    if(!availableWeeks || indexOf(availableWeeks, snappedIso) !== -1){ loadAndRenderWeekend(snappedIso); }
  }

  function boot(){
    console.log('Boot function started');
    
    // Initialize DOM references
    box = document.querySelector('.box-office');
    ul = box && box.querySelector('ul');
    weekPicker = document.getElementById('weekPicker');
    prevBtn = document.getElementById('prevWeekend');
    nextBtn = document.getElementById('nextWeekend');
    weekLabel = document.getElementById('weekLabel');
    
    console.log('DOM elements:', {box: !!box, ul: !!ul, weekPicker: !!weekPicker, weekLabel: !!weekLabel});

    // Set up event listeners after DOM is ready
    if(prevBtn) prevBtn.addEventListener('click', function(){ changeWeekBy(-7); });
    if(nextBtn) nextBtn.addEventListener('click', function(){ changeWeekBy(7); });
    
    // View toggle
    var toggleViewBtn = document.getElementById('toggleView');
    if(toggleViewBtn) toggleViewBtn.addEventListener('click', toggleView);

    if(weekPicker){
      var minIso = '1997-08-22';
      weekPicker.setAttribute('min', minIso);
      weekPicker.setAttribute('max', toIsoDate(new Date()));
      weekPicker.addEventListener('change', function(e){
        var picked = parseIsoDate(e.target.value);
        var anchor = parseIsoDate(minIso);
        var daysSince = Math.round((picked-anchor)/(1000*60*60*24));
        var weeks = Math.round(daysSince/7);
        var snapped = new Date(anchor.getTime()); snapped.setDate(anchor.getDate() + (weeks*7));
        setSelectedWeek(snapped);
        var snappedIso = toIsoDate(snapped);
        if(!availableWeeks || indexOf(availableWeeks, snappedIso) !== -1){ loadAndRenderWeekend(snappedIso); }
      });
    }

    window.addEventListener('keydown', function(e){ if(e.key === 'ArrowLeft') changeWeekBy(-7); if(e.key === 'ArrowRight') changeWeekBy(7); });
    
    // Load movie data first, then proceed with initialization
    console.log('Starting to load movie data...');
    loadMovieData()
      .then(function(){
        console.log('Movie data loaded successfully');
        var saved = null; try{ saved = localStorage.getItem(WEEK_KEY); }catch(e){}
        console.log('Saved week from localStorage:', saved);
        
        if(saved){ try{ setSelectedWeek(parseIsoDate(saved)); }catch(e){} }
        if(weekLabel && weekLabel.getAttribute('data-week')){
          var lw = weekLabel.getAttribute('data-week'); 
          console.log('Week from label:', lw);
          if(weekPicker) weekPicker.value = lw; 
          loadIndex().then(function(){ 
            console.log('Index loaded, available weeks:', availableWeeks);
            if(indexOf(availableWeeks,lw)!==-1) {
              console.log('Loading weekend:', lw);
              loadAndRenderWeekend(lw); 
            }
          }).catch(function(err){
            console.error('Index load failed:', err);
          });
          return;
        }
        var defaultIso = saved || '1997-08-22';
        console.log('Using default ISO:', defaultIso);
        setSelectedWeek(parseIsoDate(defaultIso));
        loadIndex().then(function(){ 
          console.log('Index loaded for default week');
          if(indexOf(availableWeeks, defaultIso)!==-1) {
            console.log('Loading default weekend:', defaultIso);
            loadAndRenderWeekend(defaultIso); 
          }
        }).catch(function(err){
          console.error('Default index load failed:', err);
        });
      })
      .catch(function(error){
        console.error('Failed to load movie data:', error);
      });
  }

  // Wait for DOM to be ready before initializing
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();