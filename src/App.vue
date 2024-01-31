<template>
  <button @click="onStart">Start</button>
  <button @click="onStop">Stop</button>
</template>

<script setup>
import { MediaRecorder } from 'extendable-media-recorder'

const sampleRate = 16000
const channelCount = 1
const sampleInterval = 1000
const fileName = 'sample.wav'

let mediaRecorder = null
let chunks = []

let onStart = async () => {
  try {
    let mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    let audioContext = new AudioContext({ sampleRate })

    let srcNode = new MediaStreamAudioSourceNode(audioContext, { mediaStream })
    let destNode = new MediaStreamAudioDestinationNode(audioContext, { channelCount })

    srcNode.connect(destNode)

    mediaRecorder = new MediaRecorder(destNode.stream, {
      mimeType: 'audio/wav'
    })

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data)
    }

    mediaRecorder.onstop = () => {
      let blob = new Blob(chunks)

      let link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      link.click()

      URL.revokeObjectURL(link.href)
    }

    mediaRecorder.start(sampleInterval)
  } catch (err) {
    console.warn(err)
  }
}

let onStop = () => {
  mediaRecorder.stop()
}
</script>
