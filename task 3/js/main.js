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

    var init = function(){
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            context = new AudioContext();
            gainNode = context.createGain();
            gainNode.gain.value = volume;
        } catch(e) {
            alert('Your browser do not support Web Audio API');
            return false;
        }
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
        dropZone.style.display = 'none';
        visualizationZone.style.display = 'block';
        readTags(file);
        readFile(file);
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
        source.buffer = buffer;
        source.connect(gainNode);
        destination = context.destination;
        gainNode.connect(destination);
        source.start(0);
    };

    var stop = function(){
        playButton.disabled = false;
        stopButton.disabled = true;
        source.stop(0);
        dropZone.style.display = 'block';
        visualizationZone.style.display = 'none';
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

    var setVolume = function(e) {
        coordinats = volumeBar.getBoundingClientRect();
        volume = document.body.scrollTop + coordinats.top + 100 - e.pageY;
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

    return init();
};

window.addEventListener('load', musicPlayer);
