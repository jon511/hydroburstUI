const fs = require('fs');

const { Controller, Tag, TagGroup, EthernetIP } = require('ethernet-ip')
const { DINT, BOOL, REAL } = EthernetIP.CIP.DataTypes.Types

let settingsFile = fs.readFileSync('settings.json')
let programsSettings = JSON.parse(settingsFile)

const PLC = new Controller()

let isConnected = false

PLC.subscribe(new Tag('hmiAutoMode'))
PLC.subscribe(new Tag('hmiEstopOK'))
PLC.subscribe(new Tag('hmiHydraulicPumpOn'))
PLC.subscribe(new Tag('hmiOilLevelOk'))
PLC.subscribe(new Tag('hmiWaterPressureOk'))
PLC.subscribe(new Tag('hmiReturnTankLowLevelOK'))
PLC.subscribe(new Tag('hmiReturnTankHighLevelOK'))
PLC.subscribe(new Tag('hmiDoorClosed'))
PLC.subscribe(new Tag('hmiDoorOpen'))
PLC.subscribe(new Tag('hmiDoorLockLeftActive'))
PLC.subscribe(new Tag('hmiDoorLockRightActive'))
PLC.subscribe(new Tag('hmiIntensifierForward'))
PLC.subscribe(new Tag('hmiIntensifierRetracted'))

PLC.subscribe(new Tag('hmiCycleTest_CurrentPressureStorage'))
PLC.subscribe(new Tag('hmiST_PeakPressureStorage'))
PLC.subscribe(new Tag('hmiHS_PeakPressureStorage'))
PLC.subscribe(new Tag('hmiAcutalPressure'))

PLC.connect(programsSettings.ipAddress, 0).then(() => {
    PLC.scan_rate = 50
    PLC.scan()
}).catch(() => {
    console.log('fucking error')
    PLC.destroy()
    
})

PLC.on('connect', () => isConnected = true)
PLC.on('close', () => isConnected = false)
PLC.on('timeout', () => console.log('plc timeout'))
PLC.on('error', () => console.log('error from plc'))

let TargetCycleCount = 0
let LastBurstPressure = 0.0
let ActualPressure = 0.0
let CycleTime = 0.0


let CurrentTestType = 0
let RampRate = 0

let CycleTestActive = false

const autoButton = new Tag('hmiAutoButton', null, BOOL)
const manualButton = new Tag('hmiManualButton', null, BOOL)
const startButton = new Tag('hmiStartButton', null, BOOL)
const stopButton = new Tag('hmiStopButton', null, BOOL)
const openDoorButton = new Tag('hmiDoorOpenButton', null, BOOL)
const closeDoorButton = new Tag('hmiDoorCloseButton', null, BOOL)
const waterInletButton = new Tag('hmiWaterInletButton', null, BOOL)
const clearFaultListButton = new Tag('hmiClearFaultListButton', null, BOOL)
const resetButton = new Tag('hmiResetButton', null, BOOL)

const testTypeWrite = new Tag('hmiTestTypeWrite', null, DINT)
const rampRateWrite = new Tag('hmiRampRateWrite', null, DINT)
const cycleCountWrite = new Tag('hmiCycleCountWrite', null, DINT)
const minPressureWrite = new Tag('hmiMinPressureWrite', null, DINT)
const maxPressureWrite = new Tag('hmiMaxPressureWrite', null, DINT)

const group = new TagGroup();
group.add(testTypeWrite)
group.add(rampRateWrite)
group.add(cycleCountWrite)
group.add(minPressureWrite)
group.add(maxPressureWrite)

const SendButton = (name, val) => {
    if (isConnected)
        PLC.writeTag(name, val)
    else 
        console.log('plc not connected')
}

const writeSetupToPLC = async () => {

    console.log('test')

    let a = document.querySelector('#standardTestSelected').checked
    let b = document.querySelector('#cycleTestSeleceted').checked
    let c = document.querySelector('#dynamicTestSelected').checked


    let testTypeValue
    if (a)
        testTypeValue = 1
    else if (b)
        testTypeValue = 2
    else if (c)
        testTypeValue = 3
    else
        testTypeValue = 0

    testTypeWrite.value = parseInt(testTypeValue)

    const rampRateValue = document.querySelector('#rampRateWrite').value
    rampRateWrite.value = parseInt(rampRateValue)
    
    const cycleCountValue = document.querySelector('#cycleCountWrite').value
    cycleCountWrite.value = parseInt(cycleCountValue)
    
    const minPressureValue = document.querySelector('#minPressureWrite').value
    minPressureWrite.value = parseInt(minPressureValue)
    
    const maxPressureValue = document.querySelector('#maxPressureWrite').value
    maxPressureWrite.value = parseInt(maxPressureValue)
    
    console.log(testTypeValue)
    console.log(rampRateValue)
    console.log(cycleCountValue)
    console.log(minPressureValue)
    console.log(maxPressureValue)

    await PLC.writeTagGroup(group)
}

document.getElementById('autoButton').addEventListener('mousedown', () => SendButton(autoButton, true))
document.getElementById('autoButton').addEventListener('mouseup', () => SendButton(autoButton, false))
document.getElementById('autoButton').addEventListener('mouseleave', () => SendButton(autoButton, false))

document.getElementById('manualButton').addEventListener('mousedown', () => SendButton(manualButton, true))
document.getElementById('manualButton').addEventListener('mouseup', () => SendButton(manualButton, false))
document.getElementById('manualButton').addEventListener('mouseleave', () => SendButton(manualButton, false))

document.getElementById('startButton').addEventListener('mousedown', () => SendButton(startButton, true))
document.getElementById('startButton').addEventListener('mouseup', () => SendButton(startButton, false))
document.getElementById('startButton').addEventListener('mouseleave', () => SendButton(startButton, false))

document.getElementById('stopButton').addEventListener('mousedown', () => SendButton(stopButton, true))
document.getElementById('stopButton').addEventListener('mouseup', () => SendButton(stopButton, false))
document.getElementById('stopButton').addEventListener('mouseleave', () => SendButton(stopButton, false))

document.getElementById('openDoorButton').addEventListener('mousedown', () => SendButton(openDoorButton, true))
document.getElementById('openDoorButton').addEventListener('mouseup', () => SendButton(openDoorButton, false))
document.getElementById('openDoorButton').addEventListener('mouseleave', () => SendButton(openDoorButton, false))

document.getElementById('closeDoorButton').addEventListener('mousedown', () => SendButton(closeDoorButton, true))
document.getElementById('closeDoorButton').addEventListener('mouseup', () => SendButton(closeDoorButton, false))
document.getElementById('closeDoorButton').addEventListener('mouseleave', () => SendButton(closeDoorButton, false))

document.getElementById('waterInletButton').addEventListener('mousedown', () => SendButton(waterInletButton, true))
document.getElementById('waterInletButton').addEventListener('mouseup', () => SendButton(waterInletButton, false))
document.getElementById('waterInletButton').addEventListener('mouseleave', () => SendButton(waterInletButton, false))

document.getElementById('resetButton').addEventListener('mousedown', () => SendButton(resetButton, true))
document.getElementById('resetButton').addEventListener('mouseup', () => SendButton(resetButton, false))
document.getElementById('resetButton').addEventListener('mouseleave', () => SendButton(resetButton, false))

document.getElementById('writeSetupButton').addEventListener('click', writeSetupToPLC)



PLC.forEach(tag => {
    tag.on('Initialized', tag => {
        if (tag.name === 'CycleTestActive')
            CycleTestActive = tag.value

        
    })

    tag.on('Changed', (tag, oldValue) => {

        if (tag.name === 'CycleTest_CurrentPressureStorage'){
            console.log(tag.value.toFixed(2))
        }

        if (tag.name === 'CycleTestActive')
            CycleTestActive = tag.value

        // console.log(tag.value)

        console.log(`cycle test active = ${CycleTestActive}`)

    })
})