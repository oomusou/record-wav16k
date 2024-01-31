<template>
  <button @click="onStart">Start</button>
  <button @click="onStop">Stop</button>
</template>

<script setup>
const sampleRate = 16000
const fileName = 'sample.wav'

let isRecording = false
let chunks = []

let floatTo16BitPCM = (output, offset, input) => {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]))
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
}

let writeString = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

let encodeWAV = (samples) => {
  let buffer = new ArrayBuffer(44 + samples.length * 2)
  let view = new DataView(buffer)
  /* RIFF identifier */
  writeString(view, 0, 'RIFF')
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true)
  /* RIFF type */
  writeString(view, 8, 'WAVE')
  /* format chunk identifier */
  writeString(view, 12, 'fmt ')
  /* format chunk length */
  view.setUint32(16, 16, true)
  /* sample format (raw) */
  view.setUint16(20, 1, true)
  /* channel count */
  view.setUint16(22, 1, true)
  /* sample rate */
  view.setUint32(24, sampleRate, true)
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true)
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 1 * 2, true)
  /* bits per sample */
  view.setUint16(34, 16, true)
  /* data chunk identifier */
  writeString(view, 36, 'data')
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true)

  floatTo16BitPCM(view, 44, samples)

  return view
}

let processPCMData = () => {
  let depth16bitArrayBuffer = encodeWAV(chunks)
  let blob = new Blob([depth16bitArrayBuffer])

  let link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()

  URL.revokeObjectURL(link.href)
}

let onStart = async () => {
  isRecording = true

  try {
    let mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    let audioContext = new AudioContext({ sampleRate })

    let srcNode = audioContext.createMediaStreamSource(mediaStream)
    let scriptNode = audioContext.createScriptProcessor(4096, 1, 1)
    let destNode = audioContext.createMediaStreamDestination()

    srcNode.connect(scriptNode)
    scriptNode.connect(destNode)

    scriptNode.onaudioprocess = (e) => {
      let inputData = e.inputBuffer.getChannelData(0)
      if (isRecording === true) {
        for (let x of inputData) {
          chunks.push(x)
        }
      }
    }
  } catch (err) {
    console.warn(err)
  }
}

let onStop = () => {
  isRecording = false
  processPCMData()
}
</script>
