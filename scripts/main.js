// main.js - cleaned, index-driven loader and renderer for Film Report
(function(){
  'use strict';

  // Guard against the script running twice (helps avoid duplicate rendering)
  if(typeof window !== 'undefined' && window.__filmReportInit){
    console.warn('FilmReport: script already initialized, skipping duplicate run.');
    return;
  }
  if(typeof window !== 'undefined') window.__filmReportInit = true;

  // DOM refs
  var box = document.querySelector('.box-office');
  var ul = box && box.querySelector('ul');
  var weekPicker = document.getElementById('weekPicker');
  var prevBtn = document.getElementById('prevWeekend');
  var nextBtn = document.getElementById('nextWeekend');
  var weekLabel = document.getElementById('weekLabel');

  var WEEK_KEY = 'filmreport_selected_week';

  // Combined movie data lookup
  var movieMap = {
    'GI Jane': {runtime: 125, rating: 'R' },
    'Money Talks': {runtime: 97, rating: 'R' },
    'Air Force One': {runtime: 124, rating: 'R' },
    'Mimic': {runtime: 105, rating: 'R' },
    'Conspiracy Theory': {runtime: 135, rating: 'R' },
    'Cop Land': {runtime: 104, rating: 'R' },
    'Event Horizon': {runtime: 95, rating: 'R' },
    'Leave It to Beaver': {runtime: 84, rating: 'PG' },
    'George of the Jungle': {runtime: 92, rating: 'PG' },
    'Men in Black': {runtime: 98, rating: 'PG-13' },
    'Hoodlum': {runtime: 130, rating: 'R' },
    'Excess Baggage': {runtime: 101, rating: 'PG-13' },
    'Fire Down Below': {runtime: 104, rating: 'R' },
    'The Game': {runtime: 129, rating: 'R' },
    'The Full Monty': {runtime: 91, rating: 'R' },
    'In & Out': {runtime: 90, rating: 'PG-13' },
    'Wishmaster': {runtime: 90, rating: 'R' },
    'LA Confidential': {runtime: 138, rating: 'R' },
    'A Thousand Acres': {runtime: 105, rating: 'R' },
    'The Peacemaker': {runtime: 124, rating: 'R' },
    'Soul Food': {runtime: 114, rating: 'R' },
    'The Edge': {runtime: 117, rating: 'R' },
    'Kiss the Girls': {runtime: 115, rating: 'R' },
    'Seven Years In Tibet': {runtime: 136, rating: 'PG-13' },
    'RocketMan': {runtime: 95, rating: 'PG' },
    'I Know What You Did Last Summer': {runtime: 102, rating: 'R' },
    'The Devils Advocate': {runtime: 144, rating: 'R' },
    'Gattaca': {runtime: 107, rating: 'PG-13' },
    'FairyTale A True Story': {runtime: 99, rating: 'PG' },
    'Boogie Nights': {runtime: 156, rating: 'R' },
    'Red Corner': {runtime: 122, rating: 'R' },
    'Starship Troopers': {runtime: 129, rating: 'R' },
    'Bean': {runtime: 89, rating: 'PG-13' },
    'Eves Bayou': {runtime: 109, rating: 'R' },
    'The Jackal': {runtime: 124, rating: 'R' },
    'The Little Mermaid': {runtime: 83, rating: 'G' },
    'The Man Who Knew Too Little': {runtime: 94, rating: 'PG' },
    'Mortal Kombat Annihilation': {runtime: 95, rating: 'PG-13' },
    'Anastasia': {runtime: 94, rating: 'G' },
    'The Rainmaker': {runtime: 135, rating: 'PG-13' },
    'Midnight In The Garden Of Good And Evil': {runtime: 155, rating: 'R' },
    'Flubber': {runtime: 93, rating: 'PG' },
    'Alien Resurrection': {runtime: 109, rating: 'R' },
    'Scream 2': {runtime: 120, rating: 'R' },
    'For Richer or Poorer': {runtime: 115, rating: 'PG-13' },
    'Home Alone 3': {runtime: 102, rating: 'PG' },
    'Amistad': {runtime: 155, rating: 'R' },
    'Titanic': {runtime: 194, rating: 'PG-13' },
    'Tomorrow Never Dies': {runtime: 119, rating: 'PG-13' },
    'MouseHunt': {runtime: 98, rating: 'PG' },
    'As Good As It Gets': {runtime: 139, rating: 'PG-13' },
    'Jackie Brown': {runtime: 154, rating: 'R' },
    'An American Werewolf In Paris': {runtime: 98, rating: 'R' },
    'Mr Magoo': {runtime: 87, rating: 'PG' },
    'Good Will Hunting': {runtime: 127, rating: 'R' },
    'Wag the Dog': {runtime: 97, rating: 'R' },    
    'Fallen': {runtime: 124, rating: 'R' },
    'Hard Rain': {runtime: 97, rating: 'R' },
    'Half Baked': {runtime: 82, rating: 'R' },
    'Spice World': {runtime: 93, rating: 'PG' },
    'Great Expectations': {runtime: 111, rating: 'R' },
    'Desperate Measures': {runtime: 100, rating: 'R' },
    'Deep Rising': {runtime: 106, rating: 'R' },
    'The Replacement Killers': {runtime: 87, rating: 'R' },
    'Blues Brothers 2000': {runtime: 123, rating: 'PG-13' },
    'The Wedding Singer': {runtime: 97, rating: 'PG-13' },
    'Sphere': {runtime: 134, rating: 'PG-13' },
    'The Borrowers': {runtime: 87, rating: 'PG' },
    'The Apostle': {runtime: 134, rating: 'PG-13'},
    'Senseless': {runtime: 93, rating: 'R' },
    'Palmetto': {runtime: 114, rating: 'R'},
    'Dark City': {runtime: 100, rating: 'R'},
    'US Marshals': {runtime: 131, rating: 'PG-13' },
    'Twilight': {runtime: 94, rating: 'R' },
    'Hush': {runtime: 95, rating: 'PG-13' },
    'The Big Lebowski': {runtime: 117, rating: 'R' },
    'The Man In The Iron Mask': {runtime: 132, rating: 'PG-13'},
    'Primary Colors': {runtime: 143, rating: 'R'},
    'Wild Things': {runtime: 108, rating: 'R'},
    'Mr Nice Guy': {runtime: 95, rating: 'PG-13'},
    'Grease': {runtime: 110, rating: 'PG'},
    'The Newton Boys': {runtime: 122, rating: 'PG-13'},
    'Lost in Space': {runtime: 130, rating: 'PG-13'},
    'Mercury Rising': {runtime: 111, rating: 'R'},
    'City of Angels': {runtime: 114, rating: 'PG-13'},
    'Species II': {runtime: 93, rating: 'R'},
    'The Players Club': {runtime: 104, rating: 'R'},
    'The Odd Couple II': {runtime: 97, rating: 'PG-13'},
    'The Object of my Affection': {runtime: 111, rating: 'R'},
    'Paulie': {runtime: 91, rating: 'PG'},
    'The Big Hit': {runtime: 91, rating: 'R'},
    'He Got Game': {runtime: 136, rating: 'R'},
    'Les Miserables': {runtime: 134, rating: 'PG-13'},
    'Black Dog': {runtime: 88, rating: 'PG-13'},
    'Deep Impact': {runtime: 121, rating: 'PG-13'},
    'Woo': {runtime: 84, rating: 'R'},
    'The Horse Whisperer': {runtime: 169, rating: 'R'},
    'Quest for Camelot': {runtime: 86, rating: 'G'},
    'Godzilla': {runtime: 138, rating: 'PG-13'},
    'Bulworth': {runtime: 108, rating: 'R'},
    'Fear and Loathing in Las Vegas': {runtime: 118, rating: 'R'},
    'Hope Floats': {runtime: 114, rating: 'PG-13'},
    'I Got the Hook-Up': {runtime: 93, rating: 'R'},
    'The Truman Show': {runtime: 103, rating: 'PG'},
    'A Perfect Murder': {runtime: 107, rating: 'R'},
    'Six Days, Seven Nights': {runtime: 102, rating: 'PG-13'},
    'Cant Hardly Wait': {runtime: 100, rating: 'PG-13'},
    
    
  };

  function normalizeTitle(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }

  // Build normalized lookup maps keyed by normalized title
  var runtimeLookup = {};
  var mpaaLookup = {};
  for(var key in movieMap){ 
    if(movieMap.hasOwnProperty(key)){ 
      var normalized = normalizeTitle(key);
      var data = movieMap[key];
      if(data.runtime) runtimeLookup[normalized] = data.runtime;
      if(data.rating) mpaaLookup[normalized] = data.rating;
    } 
  }

  function pad2(n){ return n < 10 ? '0' + n : String(n); }

  function toIsoDate(d){
    return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate());
  }

  function parseIsoDate(iso){
    var parts = String(iso).split('-');
    return new Date(parseInt(parts[0],10)||0, (parseInt(parts[1],10)||1)-1, parseInt(parts[2],10)||1);
  }

  function formatRuntime(mins){ if(!mins || isNaN(mins)) return '\u2014'; var h=Math.floor(mins/60); var m=mins%60; return h + 'h ' + m + 'm'; }

  function clearPosters(){ if(!ul) return; ul.innerHTML = ''; }

  function createMovieItem(movie, position){
    var li = document.createElement('li');
    var img = document.createElement('img'); 
    img.alt = movie.title || ''; 
    img.src = movie.poster || ('./images/' + (movie.title || 'no-art') + '.png'); 
    li.appendChild(img);
    
    // Box office position number
    if(position !== undefined && position !== null){
      var positionNumber = document.createElement('div');
      positionNumber.className = 'position-number';
      positionNumber.textContent = position;
      li.appendChild(positionNumber);
    }
    
    // Create overlay that shows on hover
    var overlay = document.createElement('div'); 
    overlay.className = 'hover-overlay';
    
    var title = document.createElement('div'); 
    title.className = 'overlay-title'; 
    title.textContent = movie.title || '';
    overlay.appendChild(title);
    
    var key = normalizeTitle(movie.title||'');
    
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
    
    li.appendChild(overlay);
    return li;
  }

  function generateShowtimes(runtime, position){
    if(!runtime || isNaN(runtime)) return [];
    var showtimes = [];
    
    // Calculate how many screens each movie gets based on position
    // Total 24 screens for 20 movies
    var screensAllocated;
    if(position === 1){
      screensAllocated = 3; // #1 movie gets 3 screens
    } else if(position === 2){
      screensAllocated = 2; // #2 movie gets 2 screens
    } else if(position <= 4){
      screensAllocated = 2; // #3-4 get 2 screens each
    } else {
      screensAllocated = 1; // #5-20 get 1 screen each (16 screens)
    }
    
    // Calculate total time needed per showing
    // Preshow: 2 minutes
    // Previews: 10% of runtime
    // Movie: runtime
    // Cleaning: 20 minutes
    var preshow = 2;
    var previews = Math.round(runtime * 0.10);
    var cleaning = 20;
    var totalShowDuration = preshow + previews + runtime + cleaning;
    
    // Generate showtimes based on screens and runtime
    // Start time: 11 AM (660 minutes from midnight)
    // Latest showtime start: 11 PM (1380 minutes from midnight)
    // Movies can end before 1 AM (1440 minutes from midnight)
    var startTime = 11 * 60; // 11 AM in minutes
    var latestShowtimeStart = 23 * 60; // 11 PM - no showtime can start after this
    var endTime = 25 * 60; // 1 AM next day (in minutes from midnight)
    
    // Generate staggered showtimes across multiple screens
    var allTimes = [];
    for(var screen = 0; screen < screensAllocated; screen++){
      var currentTime = startTime;
      
      // Stagger start times by 15-30 minutes per screen for variety
      if(screen > 0){
        var stagger = 15 + (screen * 20);
        currentTime += stagger;
      }
      
      // Showtime must start before 11 PM, but the movie (including preshow, previews, runtime, cleaning) can end before 1 AM
      while(currentTime <= latestShowtimeStart && currentTime + preshow + previews + runtime <= endTime){
        allTimes.push(currentTime);
        currentTime += totalShowDuration;
      }
    }
    
    // Sort all times and remove duplicates that are too close (within 10 min)
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
    
    // Convert to formatted time strings
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
    
    var key = normalizeTitle(movie.title||'');
    var runtime = runtimeLookup.hasOwnProperty(key) ? runtimeLookup[key] : null;
    var movieRating = movie.rating || (mpaaLookup.hasOwnProperty(key) ? mpaaLookup[key] : null);
    
    // Position number
    var posDiv = document.createElement('div');
    posDiv.className = 'marquee-position';
    posDiv.textContent = position;
    li.appendChild(posDiv);
    
    // Movie info container
    var infoDiv = document.createElement('div');
    infoDiv.className = 'marquee-info';
    
    // Title
    var titleDiv = document.createElement('div');
    titleDiv.className = 'marquee-title';
    titleDiv.textContent = movie.title || '';
    infoDiv.appendChild(titleDiv);
    
    // Rating and Runtime on same line
    var metaDiv = document.createElement('div');
    metaDiv.className = 'marquee-meta';
    var metaParts = [];
    if(movieRating) metaParts.push(movieRating);
    if(runtime) metaParts.push(formatRuntime(runtime));
    if(metaParts.length > 0){
      metaDiv.textContent = metaParts.join(' • ');
      infoDiv.appendChild(metaDiv);
    }
    
    li.appendChild(infoDiv);
    
    // Showtimes
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
      
      li.appendChild(showtimesDiv);
    }
    
    return li;
  }

  // View variables
  var allMovies = [];
  var currentView = 'grid'; // 'grid' or 'marquee'
  
  function renderFromArray(movies){ 
    allMovies = movies;
    if(currentView === 'grid'){
      updateGrid();
    } else {
      updateMarquee();
    }
  }
  
  function updateGrid(){
    clearPosters(); 
    if(!ul) return;
    
    // Remove marquee class if present
    if(ul.classList) ul.classList.remove('marquee-view');
    
    // Display first 10 movies (2 rows of 5)
    var maxMovies = Math.min(10, allMovies.length);
    
    for(var i = 0; i < maxMovies; i++){
      ul.appendChild(createMovieItem(allMovies[i], i + 1));
    }
  }
  
  function updateMarquee(){
    clearPosters();
    if(!ul) return;
    
    // Add marquee class
    if(ul.classList) ul.classList.add('marquee-view');
    
    for(var i = 0; i < allMovies.length; i++){
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

  function boot(){
    var saved = null; try{ saved = localStorage.getItem(WEEK_KEY); }catch(e){}
    if(saved){ try{ setSelectedWeek(parseIsoDate(saved)); }catch(e){} }
    if(weekLabel && weekLabel.getAttribute('data-week')){
      var lw = weekLabel.getAttribute('data-week'); if(weekPicker) weekPicker.value = lw; loadIndex().then(function(){ if(indexOf(availableWeeks,lw)!==-1) loadAndRenderWeekend(lw); }).catch(function(){});
      return;
    }
    var defaultIso = saved || '1997-08-22';
    setSelectedWeek(parseIsoDate(defaultIso));
    loadIndex().then(function(){ if(indexOf(availableWeeks, defaultIso)!==-1) loadAndRenderWeekend(defaultIso); }).catch(function(){});
  }

  boot();

})();