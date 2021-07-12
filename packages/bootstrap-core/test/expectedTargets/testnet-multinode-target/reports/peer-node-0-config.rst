Symbol Bootstrap Version: 1.0.8

config-database.properties
==========================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **database**;
    databaseUri; mongodb://:27017
    databaseName; catapult
    maxWriterThreads; 8
    maxDropBatchSize; 10
    writeTimeout; 10m
    **plugins**;
    catapult.mongo.plugins.accountlink; true
    catapult.mongo.plugins.aggregate; true
    catapult.mongo.plugins.lockhash; true
    catapult.mongo.plugins.locksecret; true
    catapult.mongo.plugins.metadata; true
    catapult.mongo.plugins.mosaic; true
    catapult.mongo.plugins.multisig; true
    catapult.mongo.plugins.namespace; true
    catapult.mongo.plugins.restrictionaccount; true
    catapult.mongo.plugins.restrictionmosaic; true
    catapult.mongo.plugins.transfer; true

config-extensions-broker.properties
===================================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **extensions**;
    extension.addressextraction; true
    extension.mongo; true
    extension.zeromq; true
    extension.hashcache; true

config-extensions-recovery.properties
=====================================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **extensions**;
    extension.addressextraction; false
    extension.mongo; false
    extension.zeromq; false
    extension.filespooling; true
    extension.hashcache; true

config-extensions-server.properties
===================================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **extensions**;
    extension.filespooling; false
    extension.partialtransaction; false
    extension.addressextraction; false
    extension.mongo; false
    extension.zeromq; false
    extension.harvesting; true
    extension.syncsource; true
    extension.diagnostics; true
    extension.finalization; true
    extension.hashcache; true
    extension.networkheight; false
    extension.nodediscovery; true
    extension.packetserver; true
    extension.pluginhandlers; true
    extension.sync; true
    extension.timesync; true
    extension.transactionsink; true
    extension.unbondedpruning; true

config-finalization.properties
==============================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **finalization**;
    enableVoting; true
    enableRevoteOnBoot; false
    size; 10'000
    threshold; 7'000
    stepDuration; 4m
    shortLivedCacheMessageDuration; 10m
    messageSynchronizationMaxResponseSize; 20MB
    maxHashesPerPoint; 256
    prevoteBlocksMultiple; 4
    unfinalizedBlocksDuration; 0m

config-harvesting.properties
============================
.. csv-table::
    :header: "Property", "Value", "Type", "Description"
    :delim: ;

    **harvesting**; ; ;
    harvesterSigningPrivateKey; ****************************************************************; string; Harvester signing private key.
    harvesterVrfPrivateKey; ****************************************************************; string; Harvester vrf private key.
    enableAutoHarvesting; true; bool; Set to true if auto harvesting is enabled.
    maxUnlockedAccounts; 20; uint32_t; Maximum number of unlocked accounts.
    delegatePrioritizationPolicy; Importance; harvesting::DelegatePrioritizationPolicy; Delegate harvester prioritization policy.
    beneficiaryAddress; TCR4O62LYKKDYHXW5AAOKD2IT5Q4TC2U4Q6NJVA; Address; Address of the account receiving part of the harvested fee.

config-inflation.properties
===========================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **inflation**;
    starting-at-height-2; 0
    starting-at-height-5760; 191997042
    starting-at-height-172799; 183764522
    starting-at-height-435299; 175884998
    starting-at-height-697799; 168343336
    starting-at-height-960299; 161125048
    starting-at-height-1222799; 154216270
    starting-at-height-1485299; 147603728
    starting-at-height-1747799; 141274720
    starting-at-height-2010299; 135217090
    starting-at-height-2272799; 129419202
    starting-at-height-2535299; 123869918
    starting-at-height-2797799; 118558578
    starting-at-height-3060299; 113474978
    starting-at-height-3322799; 108609356
    starting-at-height-3585299; 103952364
    starting-at-height-3847799; 99495056
    starting-at-height-4110299; 95228870
    starting-at-height-4372799; 91145612
    starting-at-height-4635299; 87237436
    starting-at-height-4897799; 83496838
    starting-at-height-5160299; 79916630
    starting-at-height-5422799; 76489934
    starting-at-height-5685299; 73210170
    starting-at-height-5947799; 70071038
    starting-at-height-6210299; 67066506
    starting-at-height-6472799; 64190804
    starting-at-height-6735299; 61438406
    starting-at-height-6997799; 58804028
    starting-at-height-7260299; 56282608
    starting-at-height-7522799; 53869300
    starting-at-height-7785299; 51559472
    starting-at-height-8047799; 49348686
    starting-at-height-8310299; 47232696
    starting-at-height-8572799; 45207434
    starting-at-height-8835299; 43269014
    starting-at-height-9097799; 41413708
    starting-at-height-9360299; 39637956
    starting-at-height-9622799; 37938346
    starting-at-height-9885299; 36311610
    starting-at-height-10147799; 34754628
    starting-at-height-10410299; 33264406
    starting-at-height-10672799; 31838082
    starting-at-height-10935299; 30472918
    starting-at-height-11197799; 29166288
    starting-at-height-11460299; 27915686
    starting-at-height-11722799; 26718706
    starting-at-height-11985299; 25573052
    starting-at-height-12247799; 24476520
    starting-at-height-12510299; 23427008
    starting-at-height-12772799; 22422496
    starting-at-height-13035299; 21461056
    starting-at-height-13297799; 20540840
    starting-at-height-13560299; 19660082
    starting-at-height-13822799; 18817090
    starting-at-height-14085299; 18010244
    starting-at-height-14347799; 17237994
    starting-at-height-14610299; 16498858
    starting-at-height-14872799; 15791412
    starting-at-height-15135299; 15114302
    starting-at-height-15397799; 14466226
    starting-at-height-15660299; 13845938
    starting-at-height-15922799; 13252246
    starting-at-height-16185299; 12684012
    starting-at-height-16447799; 12140142
    starting-at-height-16710299; 11619592
    starting-at-height-16972799; 11121364
    starting-at-height-17235299; 10644498
    starting-at-height-17497799; 10188078
    starting-at-height-17760299; 9751230
    starting-at-height-18022799; 9333114
    starting-at-height-18285299; 8932924
    starting-at-height-18547799; 8549896
    starting-at-height-18810299; 8183290
    starting-at-height-19072799; 7832404
    starting-at-height-19335299; 7496562
    starting-at-height-19597799; 7175122
    starting-at-height-19860299; 6867464
    starting-at-height-20122799; 6573000
    starting-at-height-20385299; 6291160
    starting-at-height-20647799; 6021404
    starting-at-height-20910299; 5763216
    starting-at-height-21172799; 5516100
    starting-at-height-21435299; 5279578
    starting-at-height-21697799; 5053198
    starting-at-height-21960299; 4836526
    starting-at-height-22222799; 4629144
    starting-at-height-22485299; 4430652
    starting-at-height-22747799; 4240674
    starting-at-height-23010299; 4058840
    starting-at-height-23272799; 3884804
    starting-at-height-23535299; 3718230
    starting-at-height-23797799; 3558798
    starting-at-height-24060299; 3406202
    starting-at-height-24322799; 3260150
    starting-at-height-24585299; 3120360
    starting-at-height-24847799; 2986564
    starting-at-height-25110299; 2858506
    starting-at-height-25372799; 2735938
    starting-at-height-25635299; 2618624
    starting-at-height-25897799; 2506342
    starting-at-height-26160299; 2398874
    starting-at-height-26422799; 2296014
    starting-at-height-26685299; 2197564
    starting-at-height-26947799; 2103336
    starting-at-height-27210299; 2013150
    starting-at-height-27472799; 1926828
    starting-at-height-27735299; 1844210
    starting-at-height-27997799; 1765132
    starting-at-height-28260299; 1689446
    starting-at-height-28522799; 1617006
    starting-at-height-28785299; 1547672
    starting-at-height-29047799; 1481310
    starting-at-height-29310299; 1417794
    starting-at-height-29572799; 1357000
    starting-at-height-29835299; 1298814
    starting-at-height-30097799; 1243124
    starting-at-height-30360299; 1189820
    starting-at-height-30622799; 1138802
    starting-at-height-30885299; 1089972
    starting-at-height-31147799; 1043236
    starting-at-height-31410299; 998504
    starting-at-height-31672799; 955690
    starting-at-height-31935299; 914712
    starting-at-height-32197799; 875490
    starting-at-height-32460299; 837950
    starting-at-height-32722799; 802020
    starting-at-height-32985299; 767630
    starting-at-height-33247799; 734716
    starting-at-height-33510299; 703212
    starting-at-height-33772799; 673060
    starting-at-height-34035299; 644200
    starting-at-height-34297799; 616578
    starting-at-height-34560299; 590140
    starting-at-height-34822799; 564836
    starting-at-height-35085299; 540616
    starting-at-height-35347799; 517436
    starting-at-height-35610299; 495248
    starting-at-height-35872799; 474014
    starting-at-height-36135299; 453688
    starting-at-height-36397799; 434234
    starting-at-height-36660299; 415616
    starting-at-height-36922799; 397794
    starting-at-height-37185299; 380738
    starting-at-height-37447799; 364412
    starting-at-height-37710299; 348786
    starting-at-height-37972799; 333832
    starting-at-height-38235299; 319518
    starting-at-height-38497799; 305816
    starting-at-height-38760299; 292704
    starting-at-height-39022799; 280154
    starting-at-height-39285299; 268140
    starting-at-height-39547799; 256644
    starting-at-height-39810299; 245638
    starting-at-height-40072799; 235106
    starting-at-height-40335299; 225026
    starting-at-height-40597799; 215376
    starting-at-height-40860299; 206142
    starting-at-height-41122799; 197302
    starting-at-height-41385299; 188842
    starting-at-height-41647799; 180744
    starting-at-height-41910299; 172994
    starting-at-height-42172799; 165578
    starting-at-height-42435299; 158478
    starting-at-height-42697799; 151682
    starting-at-height-42960299; 145178
    starting-at-height-43222799; 138954
    starting-at-height-43485299; 132994
    starting-at-height-43747799; 127292
    starting-at-height-44010299; 121834
    starting-at-height-44272799; 116610
    starting-at-height-44535299; 111610
    starting-at-height-44797799; 106824
    starting-at-height-45060299; 102244
    starting-at-height-45322799; 97860
    starting-at-height-45585299; 93664
    starting-at-height-45847799; 89648
    starting-at-height-46110299; 85804
    starting-at-height-46372799; 82124
    starting-at-height-46635299; 78602
    starting-at-height-46897799; 75232
    starting-at-height-47160299; 72006
    starting-at-height-47422799; 68920
    starting-at-height-47685299; 65964
    starting-at-height-47947799; 63136
    starting-at-height-48210299; 60428
    starting-at-height-48472799; 57838
    starting-at-height-48735299; 55358
    starting-at-height-48997799; 52984
    starting-at-height-49260299; 50712
    starting-at-height-49522799; 48538
    starting-at-height-49785299; 46456
    starting-at-height-50047799; 44464
    starting-at-height-50310299; 42558
    starting-at-height-50572799; 40732
    starting-at-height-50835299; 38986
    starting-at-height-51097799; 37314
    starting-at-height-51360299; 35714
    starting-at-height-51622799; 34182
    starting-at-height-51885299; 32716
    starting-at-height-52147799; 31314
    starting-at-height-52410299; 29972
    starting-at-height-52672799; 28686
    starting-at-height-52935299; 27456
    starting-at-height-53197799; 26278
    starting-at-height-53460299; 25152
    starting-at-height-53722799; 24074
    starting-at-height-53985299; 23042
    starting-at-height-54247799; 22054
    starting-at-height-54510299; 21108
    starting-at-height-54772799; 20202
    starting-at-height-55035299; 19336
    starting-at-height-55297799; 18506
    starting-at-height-55560299; 17714
    starting-at-height-55822799; 16954
    starting-at-height-56085299; 16226
    starting-at-height-56347799; 15532
    starting-at-height-56610299; 14866
    starting-at-height-56872799; 14228
    starting-at-height-57135299; 13618
    starting-at-height-57397799; 13034
    starting-at-height-57660299; 12474
    starting-at-height-57922799; 11940
    starting-at-height-58185299; 11428
    starting-at-height-58447799; 10938
    starting-at-height-58710299; 10468
    starting-at-height-58972799; 10020
    starting-at-height-59235299; 9590
    starting-at-height-59497799; 9178
    starting-at-height-59760299; 8786
    starting-at-height-60022799; 8408
    starting-at-height-60285299; 8048
    starting-at-height-60547799; 7702
    starting-at-height-60810299; 7372
    starting-at-height-61072799; 7056
    starting-at-height-61335299; 6754
    starting-at-height-61597799; 6464
    starting-at-height-61860299; 6186
    starting-at-height-62122799; 5922
    starting-at-height-62385299; 5668
    starting-at-height-62647799; 5424
    starting-at-height-62910299; 5192
    starting-at-height-63172799; 4970
    starting-at-height-63435299; 4756
    starting-at-height-63697799; 4552
    starting-at-height-63960299; 4356
    starting-at-height-64222799; 4170
    starting-at-height-64485299; 3992
    starting-at-height-64747799; 3820
    starting-at-height-65010299; 3656
    starting-at-height-65272799; 3500
    starting-at-height-65535299; 3350
    starting-at-height-65797799; 3206
    starting-at-height-66060299; 3068
    starting-at-height-66322799; 2936
    starting-at-height-66585299; 2810
    starting-at-height-66847799; 2690
    starting-at-height-67110299; 2574
    starting-at-height-67372799; 2464
    starting-at-height-67635299; 2358
    starting-at-height-67897799; 2258
    starting-at-height-68160299; 2160
    starting-at-height-68422799; 2068
    starting-at-height-68685299; 1980
    starting-at-height-68947799; 1894
    starting-at-height-69210299; 1812
    starting-at-height-69472799; 1736
    starting-at-height-69735299; 1660
    starting-at-height-69997799; 1590
    starting-at-height-70260299; 1522
    starting-at-height-70522799; 1456
    starting-at-height-70785299; 1394
    starting-at-height-71047799; 1334
    starting-at-height-71310299; 1276
    starting-at-height-71572799; 1222
    starting-at-height-71835299; 1170
    starting-at-height-72097799; 1120
    starting-at-height-72360299; 1072
    starting-at-height-72622799; 1026
    starting-at-height-72885299; 982
    starting-at-height-73147799; 938
    starting-at-height-73410299; 898
    starting-at-height-73672799; 860
    starting-at-height-73935299; 824
    starting-at-height-74197799; 788
    starting-at-height-74460299; 754
    starting-at-height-74722799; 722
    starting-at-height-74985299; 690
    starting-at-height-75247799; 662
    starting-at-height-75510299; 632
    starting-at-height-75772799; 606
    starting-at-height-76035299; 580
    starting-at-height-76297799; 554
    starting-at-height-76560299; 530
    starting-at-height-76822799; 508
    starting-at-height-77085299; 486
    starting-at-height-77347799; 466
    starting-at-height-77610299; 446
    starting-at-height-77872799; 426
    starting-at-height-78135299; 408
    starting-at-height-78397799; 390
    starting-at-height-78660299; 374
    starting-at-height-78922799; 358
    starting-at-height-79185299; 342
    starting-at-height-79447799; 328
    starting-at-height-79710299; 314
    starting-at-height-79972799; 300
    starting-at-height-80235299; 286
    starting-at-height-80497799; 274
    starting-at-height-80760299; 262
    starting-at-height-81022799; 252
    starting-at-height-81285299; 240
    starting-at-height-81547799; 230
    starting-at-height-81810299; 220
    starting-at-height-82072799; 210
    starting-at-height-82335299; 202
    starting-at-height-82597799; 194
    starting-at-height-82860299; 184
    starting-at-height-83122799; 176
    starting-at-height-83385299; 170
    starting-at-height-83647799; 162
    starting-at-height-83910299; 154
    starting-at-height-84172799; 148
    starting-at-height-84435299; 142
    starting-at-height-84697799; 136
    starting-at-height-84960299; 130
    starting-at-height-85222799; 124
    starting-at-height-85485299; 118
    starting-at-height-85747799; 114
    starting-at-height-86010299; 108
    starting-at-height-86272799; 104
    starting-at-height-86535299; 100
    starting-at-height-86797799; 96
    starting-at-height-87060299; 92
    starting-at-height-87322799; 88
    starting-at-height-87585299; 84
    starting-at-height-87847799; 80
    starting-at-height-88110299; 76
    starting-at-height-88372799; 72
    starting-at-height-88635299; 70
    starting-at-height-88897799; 66
    starting-at-height-89160299; 64
    starting-at-height-89422799; 62
    starting-at-height-89685299; 58
    starting-at-height-89947799; 56
    starting-at-height-90210299; 54
    starting-at-height-90472799; 52
    starting-at-height-90735299; 48
    starting-at-height-90997799; 46
    starting-at-height-91260299; 44
    starting-at-height-91522799; 42
    starting-at-height-91785299; 40
    starting-at-height-92047799; 40
    starting-at-height-92310299; 38
    starting-at-height-92572799; 36
    starting-at-height-92835299; 34
    starting-at-height-93097799; 32
    starting-at-height-93360299; 32
    starting-at-height-93622799; 30
    starting-at-height-93885299; 28
    starting-at-height-94147799; 28
    starting-at-height-94410299; 26
    starting-at-height-94672799; 24
    starting-at-height-94935299; 24
    starting-at-height-95197799; 22
    starting-at-height-95460299; 22
    starting-at-height-95722799; 20
    starting-at-height-95985299; 20
    starting-at-height-96247799; 18
    starting-at-height-96510299; 18
    starting-at-height-96772799; 18
    starting-at-height-97035299; 16
    starting-at-height-97297799; 16
    starting-at-height-97560299; 14
    starting-at-height-97822799; 14
    starting-at-height-98085299; 14
    starting-at-height-98347799; 12
    starting-at-height-98610299; 12
    starting-at-height-98872799; 12
    starting-at-height-99135299; 12
    starting-at-height-99397799; 10
    starting-at-height-99660299; 10
    starting-at-height-99922799; 10
    starting-at-height-100185299; 10
    starting-at-height-100447799; 8
    starting-at-height-100710299; 8
    starting-at-height-100972799; 8
    starting-at-height-101235299; 8
    starting-at-height-101497799; 8
    starting-at-height-101760299; 6
    starting-at-height-102022799; 6
    starting-at-height-102285299; 6
    starting-at-height-102547799; 6
    starting-at-height-102810299; 6
    starting-at-height-103072799; 6
    starting-at-height-103335299; 6
    starting-at-height-103597799; 4
    starting-at-height-103860299; 4
    starting-at-height-104122799; 4
    starting-at-height-104385299; 4
    starting-at-height-104647799; 4
    starting-at-height-104910299; 4
    starting-at-height-105172799; 4
    starting-at-height-105435299; 4
    starting-at-height-105697799; 4
    starting-at-height-105960299; 2
    starting-at-height-106222799; 2
    starting-at-height-106485299; 2
    starting-at-height-106747799; 2
    starting-at-height-107010299; 2
    starting-at-height-107272799; 2
    starting-at-height-107535299; 2
    starting-at-height-107797799; 2
    starting-at-height-108060299; 2
    starting-at-height-108322799; 2
    starting-at-height-108585299; 2
    starting-at-height-108847799; 2
    starting-at-height-109110299; 2
    starting-at-height-109372799; 2
    starting-at-height-109635299; 2
    starting-at-height-109897799; 2
    starting-at-height-110160299; 1
    starting-at-height-110422799; 0

config-logging-broker.properties
================================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **console**;
    sinkType; Async
    level; Info
    colorMode; Ansi
    **console.component.levels**;
    **file**;
    sinkType; Async
    level; Info
    directory; logs
    filePattern; logs/catapult_broker%4N.log
    rotationSize; 25MB
    maxTotalSize; 1000MB
    minFreeSpace; 100MB
    **file.component.levels**;

config-logging-recovery.properties
==================================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **console**;
    sinkType; Async
    level; Info
    colorMode; Ansi
    **console.component.levels**;
    **file**;
    sinkType; Async
    level; Info
    directory; logs
    filePattern; logs/catapult_recovery%4N.log
    rotationSize; 25MB
    maxTotalSize; 1000MB
    minFreeSpace; 100MB
    **file.component.levels**;

config-logging-server.properties
================================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **console**;
    sinkType; Async
    level; Info
    colorMode; Ansi
    **console.component.levels**;
    **file**;
    sinkType; Async
    level; Info
    directory; logs
    filePattern; logs/catapult_server%4N.log
    rotationSize; 25MB
    maxTotalSize; 1000MB
    minFreeSpace; 100MB
    **file.component.levels**;

config-messaging.properties
===========================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **messaging**;
    subscriberPort; 7902
    listenInterface; 0.0.0.0

config-network.properties
=========================
.. csv-table::
    :header: "Property", "Value", "Type", "Description"
    :delim: ;

    **network**; ; ;
    identifier; public-test; NetworkIdentifier; Network identifier.
    nemesisSignerPublicKey; 2267B24107405779DDF0D8FBEABD8142B97105F356F3737B1FC02220E8F90FF2; Key; Nemesis public key.
    nodeEqualityStrategy; host; NodeIdentityEqualityStrategy; Node equality strategy.
    generationHashSeed; 3B5E1FA6445653C971A50687E75E6D09FB30481055E3990C84B25E9222DC1155; ;
    epochAdjustment; 1616694977s; utils::TimeSpan; Nemesis epoch time adjustment.
    **chain**; ; ;
    enableVerifiableState; true; bool; Set to true if block chain should calculate state hashes so that state is fully verifiable at each block.
    enableVerifiableReceipts; true; bool; Set to true if block chain should calculate receipts so that state changes are fully verifiable at each block.
    currencyMosaicId; 0x091F'837E'059A'E13C; MosaicId; Mosaic id used as primary chain currency.
    harvestingMosaicId; 0x091F'837E'059A'E13C; MosaicId; Mosaic id used to provide harvesting ability.
    blockGenerationTargetTime; 30s; utils::TimeSpan; Targeted time between blocks.
    blockTimeSmoothingFactor; 3000; uint32_t; Note: A higher value makes the network more biased. Note: This can lower security because it will increase the influence of time relative to importance.
    importanceGrouping; 180; uint64_t; Number of blocks that should be treated as a group for importance purposes. Note: Importances will only be calculated at blocks that are multiples of this grouping number.
    importanceActivityPercentage; 5; uint8_t; Percentage of importance resulting from fee generation and beneficiary usage.
    maxRollbackBlocks; 0; uint32_t; Maximum number of blocks that can be rolled back.
    maxDifficultyBlocks; 60; uint32_t; Maximum number of blocks to use in a difficulty calculation.
    defaultDynamicFeeMultiplier; 100; BlockFeeMultiplier; Default multiplier to use for dynamic fees.
    maxTransactionLifetime; 6h; utils::TimeSpan; Maximum lifetime a transaction can have before it expires.
    maxBlockFutureTime; 300ms; utils::TimeSpan; Maximum future time of a block that can be accepted.
    initialCurrencyAtomicUnits; 7'842'928'625'000'000; Amount; Initial currency atomic units available in the network.
    maxMosaicAtomicUnits; 8'999'999'999'000'000; Amount; Maximum atomic units (total-supply * 10 ^ divisibility) of a mosaic allowed in the network.
    totalChainImportance; 7'842'928'625'000'000; Importance; Total whole importance units available in the network.
    minHarvesterBalance; 10'000'000'000; Amount; Minimum number of harvesting mosaic atomic units needed for an account to be eligible for harvesting.
    maxHarvesterBalance; 50'000'000'000'000; Amount; Maximum number of harvesting mosaic atomic units needed for an account to be eligible for harvesting.
    minVoterBalance; 3'000'000'000'000; Amount; Minimum number of harvesting mosaic atomic units needed for an account to be eligible for voting.
    votingSetGrouping; 720; ;
    maxVotingKeysPerAccount; 3; uint8_t; Maximum number of voting keys that can be registered at once per account.
    minVotingKeyLifetime; 28; uint32_t; Minimum number of finalization rounds for which voting key can be registered.
    maxVotingKeyLifetime; 720; uint32_t; Maximum number of finalization rounds for which voting key can be registered.
    harvestBeneficiaryPercentage; 25; uint8_t; Percentage of the harvested fee that is collected by the beneficiary account.
    harvestNetworkPercentage; 5; uint8_t; Percentage of the harvested fee that is collected by the network.
    harvestNetworkFeeSinkAddress; TCZ3UZPWWC5NR6TGGYEJ2MT4Z5ZLR3XTIVI4RHA; Address; Address of the harvest network fee sink account.
    maxTransactionsPerBlock; 6'000; uint32_t; Maximum number of transactions per block.
    **plugin:catapult.plugins.accountlink**;
    dummy; to trigger plugin load
    **plugin:catapult.plugins.aggregate**; ; ;
    maxTransactionsPerAggregate; 100; uint32_t; Maximum number of transactions per aggregate.
    maxCosignaturesPerAggregate; 25; uint8_t; Maximum number of cosignatures per aggregate.
    enableStrictCosignatureCheck; false; bool; Set to true if cosignatures must exactly match component signers. Set to false if cosignatures should be validated externally.
    enableBondedAggregateSupport; true; bool; Set to true if bonded aggregates should be allowed. Set to false if bonded aggregates should be rejected.
    maxBondedTransactionLifetime; 48h; utils::TimeSpan; Maximum lifetime a bonded transaction can have before it expires.
    **plugin:catapult.plugins.lockhash**; ; ;
    lockedFundsPerAggregate; 10'000'000; Amount; Amount that has to be locked per aggregate in partial cache.
    maxHashLockDuration; 2d; utils::BlockSpan; Maximum number of blocks for which a hash lock can exist.
    **plugin:catapult.plugins.locksecret**; ; ;
    maxSecretLockDuration; 365d; utils::BlockSpan; Maximum number of blocks for which a secret lock can exist.
    minProofSize; 0; uint16_t; Minimum size of a proof in bytes.
    maxProofSize; 1024; uint16_t; Maximum size of a proof in bytes.
    **plugin:catapult.plugins.metadata**; ; ;
    maxValueSize; 1024; uint16_t; Maximum metadata value size.
    **plugin:catapult.plugins.mosaic**; ; ;
    maxMosaicsPerAccount; 1'000; uint16_t; Maximum number of mosaics that an account can own.
    maxMosaicDuration; 3650d; utils::BlockSpan; Maximum mosaic duration.
    maxMosaicDivisibility; 6; uint8_t; Maximum mosaic divisibility.
    mosaicRentalFeeSinkAddress; TAFNXW3VXVFTGTVGATKQAR75ALQX7DQXQJRWWTA; Address; Address of the mosaic rental fee sink account.
    mosaicRentalFee; 500000; Amount; Mosaic rental fee.
    **plugin:catapult.plugins.multisig**; ; ;
    maxMultisigDepth; 3; uint8_t; Maximum number of multisig levels.
    maxCosignatoriesPerAccount; 25; uint32_t; Maximum number of cosignatories per account.
    maxCosignedAccountsPerAccount; 25; uint32_t; Maximum number of accounts a single account can cosign.
    **plugin:catapult.plugins.namespace**; ; ;
    maxNameSize; 64; uint8_t; Maximum namespace name size.
    maxChildNamespaces; 100; uint16_t; Maximum number of children for a root namespace.
    maxNamespaceDepth; 3; uint8_t; Maximum namespace depth.
    minNamespaceDuration; 30d; utils::BlockSpan; Minimum namespace duration.
    maxNamespaceDuration; 1825d; utils::BlockSpan; Maximum namespace duration.
    namespaceGracePeriodDuration; 1d; utils::BlockSpan; Grace period during which time only the previous owner can renew an expired namespace.
    reservedRootNamespaceNames; symbol, symbl, xym, xem, nem, user, account, org, com, biz, net, edu, mil, gov, info; unordered_set<string>; Reserved root namespaces that cannot be claimed.
    namespaceRentalFeeSinkAddress; TATBDUEWS2X2BKKBPVB7SY4Z626YCAERGA3IF5A; Address; Address of the namespace rental fee sink account.
    rootNamespaceRentalFeePerBlock; 2; Amount; Root namespace rental fee per block.
    childNamespaceRentalFee; 100000; Amount; Child namespace rental fee.
    **plugin:catapult.plugins.restrictionaccount**; ; ;
    maxAccountRestrictionValues; 100; uint16_t; Maximum number of account restriction values.
    **plugin:catapult.plugins.restrictionmosaic**; ; ;
    maxMosaicRestrictionValues; 20; uint8_t; Maximum number of mosaic restriction values.
    **plugin:catapult.plugins.transfer**; ; ;
    maxMessageSize; 1024; uint16_t; Maximum transaction message size.

config-node.properties
======================
.. csv-table::
    :header: "Property", "Value", "Type", "Description"
    :delim: ;

    **node**; ; ;
    port; 7900; unsigned short; Server port.
    maxIncomingConnectionsPerIdentity; 6; uint32_t; Maximum number of incoming connections per identity over primary port.
    enableAddressReuse; false; bool; Set to true if the server should reuse ports already in use.
    enableSingleThreadPool; false; bool; Set to true if a single thread pool should be used, Set to false if multiple thread pools should be used.
    enableCacheDatabaseStorage; true; bool; Set to true if cache data should be saved in a database.
    enableAutoSyncCleanup; true; bool; Set to true if temporary sync files should be automatically cleaned up. Note: This should be Set to false if broker process is running.
    fileDatabaseBatchSize; 100; ;
    enableTransactionSpamThrottling; true; bool; Set to true if transaction spam throttling should be enabled.
    transactionSpamThrottlingMaxBoostFee; 10'000'000; Amount; Maximum fee that will boost a transaction through the spam throttle when spam throttling is enabled.
    maxHashesPerSyncAttempt; 370; ;
    maxBlocksPerSyncAttempt; 360; uint32_t; Maximum number of blocks per sync attempt.
    maxChainBytesPerSyncAttempt; 100MB; utils::FileSize; Maximum chain bytes per sync attempt.
    shortLivedCacheTransactionDuration; 10m; utils::TimeSpan; Duration of a transaction in the short lived cache.
    shortLivedCacheBlockDuration; 100m; utils::TimeSpan; Duration of a block in the short lived cache.
    shortLivedCachePruneInterval; 90s; utils::TimeSpan; Time between short lived cache pruning.
    shortLivedCacheMaxSize; 10'000'000; uint32_t; Maximum size of a short lived cache.
    minFeeMultiplier; 100; BlockFeeMultiplier; Minimum fee multiplier of transactions to propagate and include in blocks.
    maxTimeBehindPullTransactionsStart; 5m; ;
    transactionSelectionStrategy; oldest; model::TransactionSelectionStrategy; Transaction selection strategy used for syncing and harvesting unconfirmed transactions.
    unconfirmedTransactionsCacheMaxResponseSize; 5MB; utils::FileSize; Maximum size of an unconfirmed transactions response.
    unconfirmedTransactionsCacheMaxSize; 20MB; uint32_t; Maximum size of the unconfirmed transactions cache.
    connectTimeout; 15s; utils::TimeSpan; Timeout for connecting to a peer.
    syncTimeout; 5m; utils::TimeSpan; Timeout for syncing with a peer.
    socketWorkingBufferSize; 16KB; utils::FileSize; Initial socket working buffer size (socket reads will attempt to read buffers of roughly this size).
    socketWorkingBufferSensitivity; 1; uint32_t; Socket working buffer sensitivity (lower values will cause memory to be more aggressively reclaimed). Note: Set to 0 will disable memory reclamation.
    maxPacketDataSize; 150MB; utils::FileSize; Maximum packet data size.
    blockDisruptorSlotCount; 4096; uint32_t; Size of the block disruptor circular buffer.
    blockElementTraceInterval; 1; uint32_t; Multiple of elements at which a block element should be traced through queue and completion.
    blockDisruptorMaxMemorySize; 300MB; ;
    transactionDisruptorSlotCount; 8192; uint32_t; Size of the transaction disruptor circular buffer.
    transactionElementTraceInterval; 10; uint32_t; Multiple of elements at which a transaction element should be traced through queue and completion.
    transactionDisruptorMaxMemorySize; 20MB; ;
    enableDispatcherAbortWhenFull; false; bool; Set to true if the process should terminate when any dispatcher is full.
    enableDispatcherInputAuditing; false; bool; Set to true if all dispatcher inputs should be audited.
    maxTrackedNodes; 5'000; uint32_t; Maximum number of nodes to track in memory.
    minPartnerNodeVersion; 1.0.0.0; ;
    maxPartnerNodeVersion; 1.0.255.255; ;
    trustedHosts; 127.0.0.1; unordered_set<string>; Trusted hosts that are allowed to execute protected API calls on this node.
    localNetworks; 127.0.0.1; unordered_set<string>; Networks that should be treated as local.
    listenInterface; 0.0.0.0; ;
    **cache_database**;
    enableStatistics; false
    maxOpenFiles; 0
    maxBackgroundThreads; 0
    maxSubcompactionThreads; 0
    blockCacheSize; 0MB
    memtableMemoryBudget; 0MB
    maxWriteBatchSize; 5MB
    **localnode**; ; ;
    host; peer-node-0; string; Node host (leave empty to auto-detect IP).
    friendlyName; peer-node-0; string; Node friendly name (leave empty to use address).
    version; 1.0.1.0; uint32_t; Node version.
    roles; Peer,Voting; ionet::NodeRoles; Node roles.
    **outgoing_connections**; ; ;
    maxConnections; 10; uint16_t; Maximum number of active connections.
    maxConnectionAge; 200; uint16_t; Maximum connection age.
    maxConnectionBanAge; 20; uint16_t; Maximum connection ban age.
    numConsecutiveFailuresBeforeBanning; 3; uint16_t; Number of consecutive connection failures before a connection is banned.
    **incoming_connections**; ; ;
    maxConnections; 512; uint16_t; Maximum number of active connections.
    maxConnectionAge; 200; uint16_t; Maximum connection age.
    maxConnectionBanAge; 20; uint16_t; Maximum connection ban age.
    numConsecutiveFailuresBeforeBanning; 3; uint16_t; Number of consecutive connection failures before a connection is banned.
    backlogSize; 512; uint16_t; Maximum size of the pending connections queue.
    **banning**; ; ;
    defaultBanDuration; 12h; utils::TimeSpan; Default duration for banning.
    maxBanDuration; 12h; utils::TimeSpan; Maximum duration for banning.
    keepAliveDuration; 48h; utils::TimeSpan; Duration to keep account in container after the ban expired.
    maxBannedNodes; 5'000; uint32_t; Maximum number of banned nodes.
    numReadRateMonitoringBuckets; 4; uint16_t; Number of read rate monitoring buckets (Set to 0 to disable read rate monitoring).
    readRateMonitoringBucketDuration; 15s; utils::TimeSpan; Duration of each read rate monitoring bucket.
    maxReadRateMonitoringTotalSize; 100MB; utils::FileSize; Maximum size allowed during full read rate monitoring period.
    minTransactionFailuresCountForBan; 8; ;
    minTransactionFailuresPercentForBan; 10; ;

config-pt.properties
====================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **partialtransactions**;
    cacheMaxResponseSize; 5MB
    cacheMaxSize; 20MB

config-task.properties
======================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **logging task**;
    startDelay; 1m
    repeatDelay; 10m
    **connect peers task for service Finalization**;
    startDelay; 2s
    repeatDelay; 1m
    **finalization task**;
    startDelay; 2m
    repeatDelay; 15s
    **pull finalization messages task**;
    startDelay; 3s
    repeatDelay; 1s
    **pull finalization proof task**;
    startDelay; 10s
    repeatDelay; 50s
    **harvesting task**;
    startDelay; 30s
    repeatDelay; 1s
    **network chain height detection**;
    startDelay; 1s
    repeatDelay; 15s
    **node discovery peers task**;
    startDelay; 1m
    minDelay; 1m
    maxDelay; 10m
    numPhaseOneRounds; 10
    numTransitionRounds; 20
    **node discovery ping task**;
    startDelay; 2m
    repeatDelay; 5m
    **age peers task for service Readers**;
    startDelay; 1m
    repeatDelay; 1m
    **batch partial transaction task**;
    startDelay; 500ms
    repeatDelay; 500ms
    **connect peers task for service Pt**;
    startDelay; 3s
    repeatDelay; 1m
    **pull partial transactions task**;
    startDelay; 10s
    repeatDelay; 3s
    **batch transaction task**;
    startDelay; 500ms
    repeatDelay; 500ms
    **connect peers task for service Sync**;
    startDelay; 1s
    repeatDelay; 1m
    **pull unconfirmed transactions task**;
    startDelay; 4s
    repeatDelay; 3s
    **synchronizer task**;
    startDelay; 3s
    repeatDelay; 3s
    **time synchronization task**;
    startDelay; 1m
    minDelay; 3m
    maxDelay; 180m
    numPhaseOneRounds; 5
    numTransitionRounds; 10
    **static node refresh task**;
    startDelay; 5ms
    minDelay; 15s
    maxDelay; 24h
    numPhaseOneRounds; 20
    numTransitionRounds; 20

config-timesync.properties
==========================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **timesynchronization**;
    maxNodes; 20
    minImportance; 10'000'000'000

config-user.properties
======================
.. csv-table::
    :header: "Property", "Value"
    :delim: ;

    **account**;
    enableDelegatedHarvestersAutoDetection; true
    **storage**;
    seedDirectory; ./seed
    certificateDirectory; ./cert
    dataDirectory; ./data
    pluginsDirectory; /usr/catapult/lib
    votingKeysDirectory; ./votingkeys