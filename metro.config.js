const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

const upstreamResolveRequest = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // In web *dev* builds, Metro pulls core react-native's AssetSourceResolver.js into
  // the graph (via the asset registry used for @expo/vector-icons fonts). That file
  // does `require('../Utilities/Platform')`, but core react-native only ships
  // Platform.android.js / Platform.ios.js — there is no web variant — so the bundle
  // fails with "Unable to resolve ../Utilities/Platform". Point any such request at
  // react-native-web's Platform, which is what we want on web anyway. Production
  // exports don't hit this path, so the branch simply never fires there.
  if (platform === 'web' && /(^|\/)Utilities\/Platform$/.test(moduleName)) {
    return context.resolveRequest(
      context,
      'react-native-web/dist/exports/Platform',
      platform
    )
  }
  return upstreamResolveRequest
    ? upstreamResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform)
}

module.exports = config
