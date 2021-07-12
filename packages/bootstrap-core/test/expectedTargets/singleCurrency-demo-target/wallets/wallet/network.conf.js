var networkTypeConfig = {
  "explorerUrl": "",
  "faucetUrl": "http://localhost:100",
  "defaultNetworkType": 168,
  "defaultNodeUrl": "http://node:3000",
  "networkConfigurationDefaults": {
    "maxMosaicDivisibility": 6,
    "namespaceGracePeriodDuration": 2592000,
    "lockedFundsPerAggregate": "10000000",
    "maxCosignatoriesPerAccount": 25,
    "blockGenerationTargetTime": 15,
    "maxNamespaceDepth": 3,
    "maxMosaicDuration": 315360000,
    "minNamespaceDuration": 60,
    "maxNamespaceDuration": 31536000,
    "maxTransactionsPerAggregate": 100,
    "maxCosignedAccountsPerAccount": 25,
    "maxMessageSize": 1024,
    "maxMosaicAtomicUnits":  9000000000000000,
    "currencyMosaicId": "5F54633454C3685B",
    "harvestingMosaicId": "5F54633454C3685B",
    "defaultDynamicFeeMultiplier": 1000,
    "epochAdjustment": 1573430400,
    "totalChainImportance": 8998999998000000,
    "generationHash": "0000000000000000000000000000000000000000000000000000000000000CCC"
  },
  "nodes": [
    {"friendlyName": "node", "roles": 2, "url": "http://node:3000"},
  ]
}
var networkConfig = { 168 : networkTypeConfig }
window.networkConfig = networkConfig
console.log('networkConfig loaded!', networkConfig)




