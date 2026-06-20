import { registerRootComponent } from 'expo'
import App from './App'

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// on native, and renders App into the root #root element on web. Without this the
// component is never mounted (blank screen with an empty #root and no error).
registerRootComponent(App)
