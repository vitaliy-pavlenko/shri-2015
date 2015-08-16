/**
 * Created by pv
 */

musicPlayer = function(){
    var context;
    var dropZone;
    var visualizationZone;
    var file;
    var fileInput;
    var buffer;
    var source;
    var destination;
    var playButton;
    var stopButton;
    var artistNameEl;
    var songNameEl;
    var fileNameEl;
    var gainNode;
    var volumeButton;
    var volumeBar;
    var isOpened = false;
    var volume = 0.5;
    var volumeSetter;
    var loading;
    var analyser;
    var canvasEl;
    var canvas;
    var visualizationArea;
    var visualData;
    var dataLength;
    var minTime;
    var maxTime;
    var showRemains = false;
    var startPlaying;
    var progressBar;
    var eqValues = {
        1 : [0,0,0,0,0,0,0,0,0,0],
        2 : [0,3,5,7,4,0,0,0,1,1],
        3 : [5,2,-3,-5,-1,2,4,6,8,8],
        4 : [-2,0,2,3,4,4,3,1,1,1],
        5 : [-1,-1,0,1,2,2,1,0,-1,-1]
    };
    var eqSelect;
    var filters;

    var init = function(){
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            context = new AudioContext();
        } catch(e) {
            alert('Your browser do not support Web Audio API');
            return false;
        }
        gainNode = context.createGain();
        gainNode.gain.value = volume;
        analyser = context.createAnalyser();
        analyser.fftSize = 256;
        dataLength = analyser.frequencyBinCount;
        visualData = new Uint8Array(dataLength);
        canvasEl = document.getElementById('visualization');
        canvas = canvasEl.getContext('2d');
        dropZone = document.getElementById('dropArea');
        visualizationZone = document.getElementById('visualizationArea');
        fileInput = document.getElementById('uploadFile');
        playButton = document.getElementById('play');
        stopButton = document.getElementById('stop');
        artistNameEl = document.getElementById('artistName');
        songNameEl = document.getElementById('songName');
        fileNameEl = document.getElementById('fileName');
        volumeButton = document.getElementById('volume');
        volumeBar = document.getElementById('volumeBar');
        volumeSetter = document.getElementById('volumeSet');
        loading = document.getElementById('loadingArea');
        minTime = document.getElementById('min');
        maxTime = document.getElementById('max');
        progressBar = document.getElementById('progressBar');
        eqSelect = document.getElementById('eqSelect');
        filters = createFilters();
        stopButton.disabled = true;
        playButton.disabled = true;
        setListeners();
    };

    var setListeners = function(){
        dropZone.addEventListener('dragover', function(e){
            e.preventDefault();
        });
        dropZone.addEventListener('click', function(){
            fileInput.click();
        });
        dropZone.addEventListener('drop', fileHandler);
        fileInput.addEventListener('change', fileHandler);
        playButton.addEventListener('click', play);
        stopButton.addEventListener('click', stop);
        volumeButton.addEventListener('mouseenter', toggleVolumeBar);
        volumeButton.addEventListener('mouseleave', toggleVolumeBar);
        volumeBar.addEventListener('mousedown', setVolume);
        maxTime.addEventListener('click', changeTimerType);
        eqSelect.addEventListener('change', eqSelectHandler);
    };

    var fileHandler = function(e){
        e.preventDefault();
        switch (e.type) {
            case 'drop':
                file = e.dataTransfer.files[0];
                break;
            case 'change':
                file = e.target.files[0];
                break;
        }
        if (file) {
            readTags(file);
            readFile(file);
        }
    };

    var readFile = function(fileName){
        loading.style.display = 'block';
        var reader = new FileReader();
        reader.onload = function(e){
            context.decodeAudioData(e.target.result, function(decodedArrayBuffer){
                buffer = decodedArrayBuffer;
                loading.style.display = 'none';
                play();
            }, function(e){
                alert('decodeAudioDataError : ' + e);
            });
        };
        reader.readAsArrayBuffer(fileName);
    };

    var play = function(){
        playButton.disabled = true;
        stopButton.disabled = false;
        source = context.createBufferSource();
        source.onended = function(){
            progressBar.style.width = 0;
            toggleDropArea();
            cancelAnimationFrame(visualizationArea);
            updateTimer();
        };
        filters = createFilters();
        source.buffer = buffer;
        source.connect(filters[0]);
        filters[filters.length - 1].connect(analyser);
        analyser.connect(gainNode);
        destination = context.destination;
        gainNode.connect(destination);
        toggleDropArea(true);
        startPlaying = context.currentTime;
        source.start(0);
        visualize();
    };

    var stop = function(){
        playButton.disabled = false;
        stopButton.disabled = true;
        progressBar.style.width = 0;
        source.stop(0);
        toggleDropArea();
        updateTimer();
        cancelAnimationFrame(visualizationArea);
    };

    var toggleVolumeBar = function() {
        if (isOpened) {
            isOpened = false;
            volumeButton.classList.remove('active__bar');
            volumeBar.style.display = 'none';
        } else {
            isOpened = true;
            volumeButton.classList.add('active__bar');
            volumeBar.style.display = 'block';
        }
    };

    var toggleDropArea = function(hide) {
        if (hide) {
            dropZone.style.display = 'none';
            visualizationZone.style.display = 'block';
        } else {
            dropZone.style.display = 'block';
            visualizationZone.style.display = 'none';
        }
    };

    var setVolume = function(e) {
        var coordinates = volumeBar.getBoundingClientRect();
        scrlTop = document.documentElement.scrollTop || document.body.scrollTop;
        volume = scrlTop + coordinates.top + 100 - e.pageY;
        gainNode.gain.value = volume/100;
        volumeSetter.style.height = volume + 'px';
    };

    var readTags = function(fileName) {
        ID3.loadTags(fileName, function() {
            var tags = ID3.getAllTags(fileName);
            setTags(tags['artist'], tags['title'], fileName.name);
        },{
            tags: ["title","artist"],
            dataReader: FileAPIReader(fileName)
        });
    };

    var setTags = function(artist, song, title){
        artist = artist || 'Unknown';
        song = song || 'Unknown';
        title = title || 'Unknown';
        artistNameEl.innerHTML = 'Artist: ' + artist;
        songNameEl.innerHTML = 'Song: ' + song;
        fileNameEl.innerHTML = 'Name: ' + title;
    };

    var visualize = function() {
        buildTimer(context.currentTime - startPlaying, source.buffer.duration);
        progressBar.style.width = (context.currentTime - startPlaying) * 100 / source.buffer.duration + '%';
        visualizationArea = requestAnimationFrame(visualize);
        analyser.getByteFrequencyData(visualData);
        var coordinates = visualizationZone.getBoundingClientRect();
        canvasEl.style.top = coordinates.top + 'px';
        canvasEl.style.left = coordinates.left + 'px';
        canvas.fillStyle = '#e6e6e6';
        canvas.fillRect(0, 0, 300, 100);
        var barWidth = Math.round(300/ dataLength);
        var barHeight;
        var x = 0;
        for (var i = 0; i < dataLength; i++) {
            barHeight = visualData[i]/2;
            canvas.fillStyle = '#80a0bc';
            canvas.fillRect(x, 100-barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    };

    var buildTimer = function(first, second) {
        min = (first>3600 ? parseInt(first/3600) + ':' : '') + parseInt((first % 3600) / 60).padding() + ':' + parseInt((first % 3600) % 60).padding();
        if (showRemains) {
            max = '-'+((second - first)>3600 ? parseInt((second - first)/3600) + ':' : '') + parseInt(((second - first) % 3600) / 60).padding() + ':' + parseInt(((second - first) % 3600) % 60).padding();
        } else {
            max = parseInt(((second) % 3600) / 60).padding() + ':' + parseInt(((second) % 3600) % 60).padding();
        }
        updateTimer(min, max);
    };

    var updateTimer = function(min, max) {
        min = min || '00:00';
        max = max || '00:00';
        minTime.innerHTML = min;
        maxTime.innerHTML = max;
    };

    var changeTimerType = function() {
        showRemains = !showRemains;
    };

    var createFilter = function (frequency) {
        var filter = context.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = frequency;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
    };

    var createFilters = function () {
        var frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
        filters = frequencies.map(createFilter);
        filters.reduce(function (prev, curr) {
            prev.connect(curr);
            return curr;
        });
        return filters;
    };

    var eqSelectHandler = function() {
        if (eqSelect.selectedIndex) {
            eqSelect.options[0].disabled = true;
            setEqValues(eqSelect.selectedIndex);
        }
    };

    var setEqValues = function(type) {
        filters.forEach(function(item, i){
            item.gain.value = eqValues[type][i];
        })
    };

    return init();
};

Number.prototype.padding = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
};

window.addEventListener('load', musicPlayer);
