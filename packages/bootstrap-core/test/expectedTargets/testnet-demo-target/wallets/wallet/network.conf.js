var networkTypeConfig = {
  "explorerUrl": "",
  "faucetUrl": "http://localhost:100",
  "defaultNetworkType": 152,
  "defaultNodeUrl": "http://node:3000",
  "networkConfigurationDefaults": {
    "maxMosaicDivisibility": 6,
    "namespaceGracePeriodDuration": 86400,
    "lockedFundsPerAggregate": "10000000",
    "maxCosignatoriesPerAccount": 25,
    "blockGenerationTargetTime": 30,
    "maxNamespaceDepth": 3,
    "maxMosaicDuration": 315360000,
    "minNamespaceDuration": 2592000,
    "maxNamespaceDuration": 157680000,
    "maxTransactionsPerAggregate": 100,
    "maxCosignedAccountsPerAccount": 25,
    "maxMessageSize": 1024,
    "maxMosaicAtomicUnits":  8999999999000000,
    "currencyMosaicId": "091F837E059AE13C",
    "harvestingMosaicId": "091F837E059AE13C",
    "defaultDynamicFeeMultiplier": 100,
    "epochAdjustment": 1616694977,
    "totalChainImportance": 7842928625000000,
    "generationHash": "3B5E1FA6445653C971A50687E75E6D09FB30481055E3990C84B25E9222DC1155"
  },
  "nodes": [
    {"friendlyName": "node", "roles": 2, "url": "http://node:3000"},
    {"friendlyName": "ngl-dual-501.testnet.symboldev.network", "roles": 2, "url": "http://ngl-dual-501.testnet.symboldev.network:3000"},
    {"friendlyName": "ngl-dual-601.testnet.symboldev.network", "roles": 2, "url": "http://ngl-dual-601.testnet.symboldev.network:3000"},
    {"friendlyName": "ngl-dual-001.testnet.symboldev.network", "roles": 2, "url": "http://ngl-dual-001.testnet.symboldev.network:3000"},
    {"friendlyName": "ngl-dual-101.testnet.symboldev.network", "roles": 2, "url": "http://ngl-dual-101.testnet.symboldev.network:3000"},
    {"friendlyName": "ngl-dual-201.testnet.symboldev.network", "roles": 2, "url": "http://ngl-dual-201.testnet.symboldev.network:3000"},
    {"friendlyName": "ngl-dual-301.testnet.symboldev.network", "roles": 2, "url": "http://ngl-dual-301.testnet.symboldev.network:3000"},
    {"friendlyName": "ngl-dual-401.testnet.symboldev.network", "roles": 2, "url": "http://ngl-dual-401.testnet.symboldev.network:3000"},
    {"friendlyName": "ngl-dual-502.testnet.symboldev.network", "roles": 2, "url": "http://ngl-dual-502.testnet.symboldev.network:3000"},
    {"friendlyName": "ngl-dual-602.testnet.symboldev.network", "roles": 2, "url": "http://ngl-dual-602.testnet.symboldev.network:3000"},
    {"friendlyName": "ngl-api-001.testnet.symboldev.network", "roles": 2, "url": "http://ngl-api-001.testnet.symboldev.network:3000"},
    {"friendlyName": "ngl-api-101.testnet.symboldev.network", "roles": 2, "url": "http://ngl-api-101.testnet.symboldev.network:3000"},
  ]
}
var networkConfig = { 152 : networkTypeConfig }
window.networkConfig = networkConfig
console.log('networkConfig loaded!', networkConfig)




