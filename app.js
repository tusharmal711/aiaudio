// DOM elements
const startRecordingBtn = document.getElementById('start-recording');
const stopRecordingBtn = document.getElementById('stop-recording');
const toneSelect = document.getElementById('tone-select');
const audioPlayback = document.getElementById('audio-playback');

let mediaRecorder;
let audioChunks = [];
let audioContext;
let source;
let audioBuffer;

// Start recording function
startRecordingBtn.addEventListener('click', () => {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      startRecordingBtn.disabled = true;
      stopRecordingBtn.disabled = false;

      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };
    })
    .catch(err => console.error('Error accessing microphone:', err));
});

// Stop recording function
stopRecordingBtn.addEventListener('click', () => {
  mediaRecorder.stop();
  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    audioChunks = [];

    // Load the audio into Web Audio API
    const arrayBuffer = await audioBlob.arrayBuffer();
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    applyToneChange();

    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
  };
});

// Apply selected tone effect
function applyToneChange() {
  const toneValue = toneSelect.value;
  let playbackRate = 1;

  if (toneValue === 'low') {
    playbackRate = 0.8; // Lower pitch
  } else if (toneValue === 'high') {
    playbackRate = 1.5; // Higher pitch
  }

  const outputBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);

    for (let sample = 0; sample < inputData.length; sample++) {
      outputData[sample] = inputData[sample];
    }
  }

  source = audioContext.createBufferSource();
  source.buffer = outputBuffer;
  source.playbackRate.value = playbackRate;
  source.connect(audioContext.destination);
  
  // Create audio playback
  const audioUrl = URL.createObjectURL(new Blob([audioChunks[0]], { type: 'audio/webm' }));
  audioPlayback.src = audioUrl;
  audioPlayback.play();
}
