/**
 * Dependencies
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Styles
 */

const audioStyle = {
  width: '400px',
}
const warningText = {
  color: 'red'
}
const selectStyle = {
  margin: '10px',
  padding: '5px',
  border: '1px solid black',
  borderRadius: '5px',
}
const btnRecord = {
  margin: '10px 0px',
  padding: '5px',
  border: '1px solid black',
  borderRadius: '5px',
  backgroundColor: '#99CC99',
  borderColor: '#89b789',
  fontSize: '1.2rem',
  cursor: 'pointer',
  boxShadow: '1px 1px #5F805F',
  color: '#fff',
  fontWeight: 'bold',
}
const btnStop = {
  margin: '10px 0px',
  padding: '5px',
  border: '1px solid black',
  borderRadius: '5px',
  backgroundColor: '#B06C67',
  borderColor: '#9E615C',
  fontSize: '1.2rem',
  cursor: 'pointer',
  boxShadow: '1px 1px #6E4340',
  color: '#fff',
  fontWeight: 'bold',
}
const btnDelete = {
  padding: '5px',
  border: 'none',
  borderRadius: '5px',
  backgroundColor: '#D0D0D0',
  cursor: 'pointer',
}

/**
 * Helpers
 */

async function getDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("enumerateDevices() not supported.");
    return;
  }

  try {
    // The MediaDevices method enumerateDevices() requests a list of
    // the available media input and output devices, such as
    // microphones, cameras, headsets, and so forth.
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
  } catch (err) {
    console.log(err.name + ": " + err.message);
  }
}

export default function Recorder() {
  const [devices, setDevices] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioFiles, setAudioFiles] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [chunks, setChunks] = useState([]);
  const audioRef = useRef();

  useEffect(async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    setDevices(await getDevices());
  }, [])

  async function toggleAudioInput(e) {
    e.preventDefault();
    const option   = e.target.options[e.target.selectedIndex]
    const deviceId = option.value
    const label    = option.text

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } }
    });

    // NOTE: this will start playing audio immediately.
    // audioRef.current.srcObject = stream;
    // audioRef.current.play();

    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) {
        setChunks(c => [...c, e.data]);
      }
    };
    setMediaRecorder(recorder);
  }

  function startRecording(e) {
    e.preventDefault();
    // Remove old data chunks
    setChunks([]);

    if (mediaRecorder) {
      // Start recording with 10ms buffer
      mediaRecorder.start(10);
      // Toggle recording state
      setIsRecording(true);
    } else {
      alert("Audio device not accessible. Check devices and site permissions.")
    }
  }

  function stopRecording(e) {
    e.preventDefault();
    // Stop recording
    mediaRecorder.stop();
    // Toggle recording state
    setIsRecording(false);
    // Save the audio to memory
    saveAudio();
  }

  function saveAudio() {
    // Convert chunks to blob
    const blob = new Blob(chunks, { type: 'audio/*' });
    // Generate audio url from blob
    const audioURL = window.URL.createObjectURL(blob);
    // Append audioURL to list of saved audio for rendering
    setAudioFiles(a => [...a, audioURL])
  }

  function deleteAudio(audioURL) {
    // Filter out audioURL from the list of saved audio
    setAudioFiles(a => a.filter(a => a !== audioURL));
  }

  return (
    <div>
      <audio style={audioStyle} ref={audioRef}></audio>

      <div>
        <label htmlFor="input-audio">Input Audio:</label>
        <select name="input-audio" id="input-audio" style={selectStyle} onChange={toggleAudioInput} disabled={isRecording}>
          <option value="">--Please choose an option--</option>
          {devices ? devices.map((device, i) => {
            if (device.kind === 'audioinput') {
              return <option key={i} value={device.deviceId}>{device.label}</option>
            } else {
              return ''
            }
          }) : ''
          }
        </select>
      </div>

      <div>
        {devices.length > 0 && !isRecording && <button style={btnRecord} onClick={e => startRecording(e)}>Record</button>}
        {isRecording && <button style={btnStop} onClick={e => stopRecording(e)}>Stop</button>}
        {devices.length == 0 && <h3 style={warningText}>Audio device not accessible. Check devices and site permissions.</h3>}
      </div>

      <div>
        {audioFiles.length > 0 && <h3>Audio Files:</h3>}
        {audioFiles.map((audioURL, i) => (
          <div key={`audio_${i}`}>
            <audio controls style={audioStyle} src={audioURL} />
            <div>
              <button style={btnDelete} onClick={() => deleteAudio(audioURL)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
