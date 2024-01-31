import { createApp } from 'vue'
import App from './App.vue'
import { register } from 'extendable-media-recorder'
import { connect } from 'extendable-media-recorder-wav-encoder'

await register(await connect())
createApp(App).mount('#app')
