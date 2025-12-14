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
    'Seven Years in Tibet': {runtime: 136, rating: 'PG-13' },
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
    'Midnight in the Garden of Good and Evil': {runtime: 155, rating: 'R' },
    'Flubber': {runtime: 93, rating: 'PG' },
    'Alien Resurrection': {runtime: 109, rating: 'R' },
    'Scream 2': {runtime: 120, rating: 'R' },
    'For Richer or Poorer': {runtime: 115, rating: 'PG-13' },
    'Home Alone 3': {runtime: 102, rating: 'PG' },
    'Amistad': {runtime: 155, rating: 'R' },
    'Titanic': {runtime: 194, rating: 'PG-13' },
    'Tomorrow Never Dies': {runtime: 119, rating: 'PG-13' },
    'Mousehunt': {runtime: 98, rating: 'PG' },
    'As Good as It Gets': {runtime: 139, rating: 'PG-13' },
    'Jackie Brown': {runtime: 154, rating: 'R' },
    'An American Werewolf in Paris': {runtime: 98, rating: 'R' },
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
    'The Object of My Affection': {runtime: 111, rating: 'R'},
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
    'The X-Files': {runtime: 121, rating: 'PG-13'},
    'Mulan': {runtime: 88, rating: 'G'},
    'Doctor Dolittle': {runtime: 85, rating: 'PG-13'},
    'Out of Sight': {runtime: 123, rating: 'R'},
    'Armageddon': {runtime: 151, rating: 'PG-13'},
    'Lethal Weapon 4': {runtime: 127, rating: 'R'},
    'Small Soldiers': {runtime: 110, rating: 'PG-13'},
    'Madeline': {runtime: 89, rating: 'PG'},
    'The Mask of Zorro': {runtime: 136, rating: 'PG-13'},
    'Theres Something About Mary': {runtime: 120, rating: 'R'},
    'Saving Private Ryan': {runtime: 169, rating: 'R'},
    'Mafia': {runtime: 84, rating: 'PG-13'},
    'The Parent Trap': {runtime: 128, rating: 'PG'},
    'The Negotiator': {runtime: 140, rating: 'R'},
    'Ever After A Cinderella Story': {runtime: 121, rating: 'PG-13'},
    'Snake Eyes': {runtime: 98, rating: 'R'},
    'Halloween H20': {runtime: 86, rating: 'R'},
    'How Stella Got Her Groove Back': {runtime: 124, rating: 'R'},
    'The Avengers': {runtime: 89, rating: 'PG-13'},
    'Blade': {runtime: 121, rating: 'R'},
    'Dance with Me': {runtime: 126, rating: 'PG'},
    '54': {runtime: 93, rating: 'R'},
    'Why Do Fools Fall in Love': {runtime: 116, rating: 'R'},
    'Knock Off': {runtime: 91, rating: 'R'},
    'Rounders': {runtime: 121, rating: 'R'},
    'Simon Birch': {runtime: 114, rating: 'PG'},
    'Rush Hour': {runtime: 97, rating: 'PG-13'},
    'One True Thing': {runtime: 127, rating: 'R'},
    'Ronin': {runtime: 122, rating: 'R'},
    'Urban Legend': {runtime: 100, rating: 'R'},
    'Antz': {runtime: 83, rating: 'PG'},
    'What Dreams May Come': {runtime: 113, rating: 'PG-13'},
    'A Night at the Roxbury': {runtime: 82, rating: 'PG-13'},
    'Holy Man': {runtime: 114, rating: 'PG'},
    'Practical Magic': {runtime: 104, rating: 'PG-13'},
    'Bride of Chucky': {runtime: 89, rating: 'R'},
    'Beloved': {runtime: 172, rating: 'R'},
    'Pleasantville': {runtime: 124, rating: 'PG-13'},
    'Soldier': {runtime: 99, rating: 'R'},
    'Apt Pupil': {runtime: 107, rating: 'R'},
    'Vampires': {runtime: 108, rating: 'R'},
    'The Waterboy': {runtime: 90, rating: 'PG-13'},
    'The Siege': {runtime: 116, rating: 'R'},
    'The Wizard of Oz': {runtime: 102, rating: 'G'},
    'Living Out Loud': {runtime: 100, rating: 'R'},
    'I Still Know What You Did Last Summer': {runtime: 100, rating: 'R'},
    'Meet Joe Black': {runtime: 178, rating: 'PG-13'},
    'Ill Be Home for Christmas': {runtime: 86, rating: 'PG'},
    'The Rugrats Movie': {runtime: 80, rating: 'G'},
    'Enemy of the State': {runtime: 132, rating: 'R'},
    'A Bugs Life': {runtime: 95, rating: 'G'},
    'Babe Pig in the City': {runtime: 96, rating: 'G'},
    'Home Fries': {runtime: 93, rating: 'PG-13'},
    'Elizabeth': {runtime: 123, rating: 'R'},
    'Psycho': {runtime: 104, rating: 'R'},
    'Star Trek Insurrection': {runtime: 102, rating: 'PG'},
    'Jack Frost': {runtime: 101, rating: 'PG'},
    'Youve Got Mail': {runtime: 119, rating: 'PG'},
    'The Prince of Egypt': {runtime: 99, rating: 'PG'},
    'Patch Adams': {runtime: 115, rating: 'PG-13'},
    'Stepmom': {runtime: 125, rating: 'PG-13'},
    'The Faculty': {runtime: 104, rating: 'R'},
    'Mighty Joe Young': {runtime: 114, rating: 'PG'},
    'Shakespeare in Love': {runtime: 124, rating: 'R'},
    'A Civil Action': {runtime: 115, rating: 'PG-13'},
    'Varsity Blues': {runtime: 106, rating: 'R'},
    'The Thin Red Line': {runtime: 171, rating: 'R'},
    'At First Sight': {runtime: 128, rating: 'PG-13'},
    'Virus': {runtime: 100, rating: 'R'},
    'Shes All That': {runtime: 95, rating: 'PG-13'},
    'Payback': {runtime: 100, rating: 'R'},
    'Message in a Bottle': {runtime: 131, rating: 'PG-13'},
    'My Favorite Martian': {runtime: 94, rating: 'PG'},
    'Blast from the Past': {runtime: 112, rating: 'PG-13'},
    'Rushmore': {runtime: 93, rating: 'R'},
    'October Sky': {runtime: 108, rating: 'PG'},
    'Office Space': {runtime: 90, rating: 'R'},
    '8MM': {runtime: 123, rating: 'R'},
    'The Other Sister': {runtime: 130, rating: 'PG-13'},
    'Analyze This': {runtime: 103, rating: 'R'},
    'Cruel Intentions': {runtime: 98, rating: 'R'},
    'The Rage Carrie 2': {runtime: 104, rating: 'R'},
    'The Corruptor': {runtime: 110, rating: 'R'},
    'Baby Geniuses': {runtime: 97, rating: 'PG'},
    'The Deep End of the Ocean': {runtime: 106, rating: 'PG-13'},
    'Wing Commander': {runtime: 100, rating: 'PG-13'},
    'Forces of Nature': {runtime: 105, rating: 'PG-13'},
    'True Crime': {runtime: 127, rating: 'R'},
    'The King & I': {runtime: 87, rating: 'G'},
    'Edtv': {runtime: 123, rating: 'PG-13'},
    'The Mod Squad': {runtime: 92, rating: 'R'},
    'Dougs 1st Movie': {runtime: 76, rating: 'G'},
    'Life is Beautiful': {runtime: 116, rating: 'PG-13'},
    'The Matrix': {runtime: 136, rating: 'R'},
    '10 Things I Hate About You': {runtime: 97, rating: 'PG-13'},
    'The Out of Towners': {runtime: 90, rating: 'PG-13'},
    'Never Been Kissed': {runtime: 107, rating: 'PG-13'},
    'Go': {runtime: 102, rating: 'R'},
    'Life': {runtime: 108, rating: 'R'},
    'Pushing Tin': {runtime: 124, rating: 'R'},
    'Lost & Found': {runtime: 95, rating: 'PG-13'},
    'Entrapment': {runtime: 112, rating: 'PG-13'},
    'The Mummy': {runtime: 124, rating: 'PG-13'},
    'Election': {runtime: 103, rating: 'R'},
    'Black Mask': {runtime: 99, rating: 'R'},
    'A Midsummer Nights Dream': {runtime: 116, rating: 'PG-13'},
    'Star Wars The Phantom Menace': {runtime: 136, rating: 'PG'},
    'The Love Letter': {runtime: 88, rating: 'PG-13'},
    'Notting Hill': {runtime: 124, rating: 'PG-13'},
    'The Thirteenth Floor': {runtime: 100, rating: 'R'},
    'Instinct': {runtime: 124, rating: 'R'},
    'Austin Powers The Spy Who Shagged Me': {runtime: 95, rating: 'PG-13'},
    'Tea with Mussolini': {runtime: 117, rating: 'PG'},
    'Tarzan': {runtime: 88, rating: 'G'},
    'The Generals Daughter': {runtime: 116, rating: 'R'},
    'Big Daddy': {runtime: 93, rating: 'PG-13'},
    'An Ideal Husband': {runtime: 97, rating: 'PG-13'},
    'Wild Wild West': {runtime: 106, rating: 'PG-13'},
    'South Park Bigger Longer & Uncut': {runtime: 81, rating: 'R'},
    'Summer of Sam': {runtime: 142, rating: 'R'},
    'American Pie': {runtime: 95, rating: 'R'},
    'Eyes Wide Shut': {runtime: 159, rating: 'R'},
    'Lake Placid': {runtime: 82, rating: 'R'},
    'The Wood': {runtime: 106, rating: 'R'},
    'The Haunting': {runtime: 113, rating: 'PG-13'},
    'Inspector Gadget': {runtime: 78, rating: 'PG'},
    'Runaway Bride': {runtime: 116, rating: 'PG'},
    'The Blair Witch Project': {runtime: 81, rating: 'R'},
    'Deep Blue Sea': {runtime: 105, rating: 'R'},
    'The Sixth Sense': {runtime: 107, rating: 'PG-13'},
    'The Thomas Crown Affair': {runtime: 113, rating: 'R'},
    'Mystery Men': {runtime: 121, rating: 'PG-13'},
    'The Iron Giant': {runtime: 86, rating: 'PG'},
    'Bowfinger': {runtime: 97, rating: 'PG-13'},
    'Mickey Blue Eyes': {runtime: 102, rating: 'PG-13'},
    'The 13th Warrior': {runtime: 102, rating: 'R'},
    'The Astronauts Wife': {runtime: 109, rating: 'R'},
    'The Muse': {runtime: 97, rating: 'PG-13'},
    'Chill Factor': {runtime: 101, rating: 'R'},
    'Stigmata': {runtime: 103, rating: 'R'},
    'Stir of Echoes': {runtime: 99, rating: 'R'},
    'Blue Streak': {runtime: 93, rating: 'PG-13'},
    'For Love of the Game': {runtime: 138, rating: 'PG-13'},
    'Double Jeopardy': {runtime: 105, rating: 'R'},
    'American Beauty': {runtime: 122, rating: 'R'},
    'Three Kings': {runtime: 114, rating: 'R'},
    'Drive Me Crazy': {runtime: 91, rating: 'PG-13'},
    'The Adventures of Elmo in Grouchland': {runtime: 73, rating: 'G'},
    'Random Hearts': {runtime: 133, rating: 'R'},
    'Superstar': {runtime: 82, rating: 'PG-13'},
    'Fight Club': {runtime: 139, rating: 'R'},
    'The Story of Us': {runtime: 96, rating: 'R'},
    'The Best Man': {runtime: 120, rating: 'R'},
    'Bringing Out the Dead': {runtime: 121, rating: 'R'},
    'House on Haunted Hill': {runtime: 93, rating: 'R'},
    'Music of the Heart': {runtime: 124, rating: 'PG'},
    'The Bone Collector': {runtime: 118, rating: 'R'},
    'The Bachelor': {runtime: 101, rating: 'PG-13'},
    'The Insider': {runtime: 158, rating: 'R'},
    'Pokemon The First Movie': {runtime: 85, rating: 'G'},
    'Dogma': {runtime: 130, rating: 'R'},
    'The Messenger The Story of Joan of Arc': {runtime: 158, rating: 'R'},
    'Anywhere But Here': {runtime: 114, rating: 'PG-13'},
    'The World Is Not Enough': {runtime: 128, rating: 'PG-13'},
    'Sleepy Hollow': {runtime: 105, rating: 'R'},
    'Being John Malkovich': {runtime: 113, rating: 'R'},
    'Toy Story 2': {runtime: 92, rating: 'G'},
    'End of Days': {runtime: 122, rating: 'R'},
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
    
    // ✅ FIXED: Append overlay to posterWrapper instead of li
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
    
    // Screen allocation rules
    var screensAllocated;
    if(position === 1){
      screensAllocated = 2; // #1 movie gets 2 screens
    } else if(position === 2){
      screensAllocated = 2; // #2 movie gets 2 screens
    } else if(position <= 6){
      screensAllocated = 1; // #3-6 get 1 screen each
    } else {
      screensAllocated = 1; // #7-10 get 1 screen each
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
    for(var screen = 0; screen < screensAllocated; screen++){
      var currentTime = startTime;

      // ⭐ Randomize first showtime between 11:00 AM and 1:00 PM (0–120 min)
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

    // Title + Rating + Runtime (on same line)
    var titleRatingDiv = document.createElement('div');
    titleRatingDiv.className = 'marquee-title-rating';
    var titleText = movie.title || '';
    var key = normalizeTitle(movie.title || '');
    var movieRating = movie.rating || (mpaaLookup.hasOwnProperty(key) ? mpaaLookup[key] : null);
    var runtime = runtimeLookup.hasOwnProperty(key) ? runtimeLookup[key] : null;
    
    if(movieRating) titleText += ' • ' + movieRating;
    if(runtime) titleText += ' • ' + formatRuntime(runtime);
    
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
    
    // Remove marquee header if present
    var existingHeader = box && box.querySelector('.marquee-header');
    if(existingHeader) existingHeader.remove();
    
    // Add "Now Showing" header
    addNowShowingHeader();
    
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
    
    // Remove "Now Showing" header if present
    // var existingNowShowing = box && box.querySelector('.now-showing-header');
    // if(existingNowShowing) existingNowShowing.remove();
    
    // Add Hellebrand Cinemas header if not already present
    var existingHeader = box && box.querySelector('.marquee-header');
    if(!existingHeader && box){
      var header = document.createElement('div');
      header.className = 'marquee-header';
      header.textContent = 'Hellebrand Cinemas 12';
      box.insertBefore(header, ul);
    }
    
    // Only show first 10 movies in marquee view
    var maxMovies = Math.min(10, allMovies.length);
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