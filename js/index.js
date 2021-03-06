const fs = require('fs');

const { Controller, Tag, TagGroup, EthernetIP } = require('ethernet-ip');
const { prependListener } = require('process');
const { DINT, BOOL, REAL } = EthernetIP.CIP.DataTypes.Types

let settingsFile = fs.readFileSync('settings.json')
let programsSettings = JSON.parse(settingsFile)

const PLC = new Controller()

let isConnected = false

let standardTestSelected = false
let cycleTestSelected = false
let dynamicTestSelected = false
let partTransducerValue = 0
let accTransducerValue = 0


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
    //PLC.scan()
    setInterval(readGroup1, 50)
}).catch(() => {
    console.log('PLC connection error')
    PLC.destroy()
    
})

const ReadTag = (tag) => {
    PLC.readTag(autoButton)
}

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
const standardTestPushbutton = new Tag('hmiStandTestSelectPushbutton', null, BOOL)
const cycleTestPushbutton = new Tag('hmiCycleTestSelectPushbutton', null, BOOL)
const dynamicTestPushbutton = new Tag('hmiDynamicTestSelectPushbutton', null, BOOL)

const testTypeWrite = new Tag('hmiTestTypeWrite', null, DINT)
const rampRateWrite = new Tag('hmiRampRateWrite', null, DINT)
const cycleCountWrite = new Tag('hmiCycleCountWrite', null, DINT)
const minPressureWrite = new Tag('hmiMinPressureWrite', null, DINT)
const maxPressureWrite = new Tag('hmiMaxPressureWrite', null, DINT)

const group = new TagGroup()
group.add(testTypeWrite)
group.add(rampRateWrite)
group.add(cycleCountWrite)
group.add(minPressureWrite)
group.add(maxPressureWrite)

const group1 = new TagGroup()
group1.add(new Tag('hmiAutoMode'))
group1.add(new Tag('hmiEstopOK'))
group1.add(new Tag('hmiHydraulicPumpOn'))
group1.add(new Tag('hmiOilLevelOk'))
group1.add(new Tag('hmiWaterPressureOk'))
group1.add(new Tag('hmiReturnTankLowLevelOK'))
group1.add(new Tag('hmiReturnTankHighLevelOK'))
group1.add(new Tag('hmiDoorClosed'))
group1.add(new Tag('hmiDoorOpen'))
group1.add(new Tag('hmiDoorLockLeftActive'))
group1.add(new Tag('hmiDoorLockRightActive'))
group1.add(new Tag('hmiIntensifierForward'))
group1.add(new Tag('hmiIntensifierRetracted'))
group1.add(new Tag('hmiStandardTestSelected'))
group1.add(new Tag('hmiCycleTestSelected'))
group1.add(new Tag('hmiDynamicTestSelected'))
group1.add(new Tag('hmiRampRate'))
group1.add(new Tag('hmiCycleCount'))
group1.add(new Tag('hmiMinPressure'))
group1.add(new Tag('hmiMaxPressure'))
group1.add(new Tag('hmiActualPartPressure'))
group1.add(new Tag('hmiActualAccumulatorPressure'))
group1.add(new Tag('hmiWaterInletIndicator'))
group1.add(new Tag('hmiAutoIndicator'))
group1.add(new Tag('hmiManualIndicator'))
group1.add(new Tag('hmiStartIndicator'))
group1.add(new Tag('hmiStopIndicator'))
group1.add(new Tag('hmiResetIndicator'))
group1.add(new Tag('hmiDoorOpenIndicator'))
group1.add(new Tag('hmiDoorCloseIndicator'))

const updateBooleanElement = (element, value) => {
    if (value){
        document.getElementById(element).classList.remove('ind-off')
        document.getElementById(element).classList.add('ind-on')
    }else{
        document.getElementById(element).classList.remove('ind-on')
        document.getElementById(element).classList.add('ind-off')
    }

}

const updateIndicatorElement = (element, value) => {
    if (value){
        document.getElementById(element).classList.remove('led-gray')
        document.getElementById(element).classList.add('led-green')
    }else{
        document.getElementById(element).classList.remove('led-green')
        document.getElementById(element).classList.add('led-gray')
    }

}


const updateUI = () => {
    if(standardTestSelected){
        document.querySelector('#standardTestButton').classList.add('green')
    }else{
        document.querySelector('#standardTestButton').classList.remove('green')
    }

    if(cycleTestSelected){
        document.querySelector('#cycleTestButton').classList.add('green')
    }else{
        document.querySelector('#cycleTestButton').classList.remove('green')
    }

    if(dynamicTestSelected){
        document.querySelector('#dynamicTestButton').classList.add('green')
    }else{
        document.querySelector('#dynamicTestButton').classList.remove('green')
    }

    document.querySelector('#rampRateActual').innerHTML = CycleTest.RampRate
    document.querySelector('#cyclecountActual').innerHTML = CycleTest.CycleCount
    document.querySelector('#minPressureActual').innerHTML = CycleTest.MinPressure
    document.querySelector('#maxPressureActual').innerHTML = CycleTest.MaxPressure
    document.querySelector('#partTransducerActual').innerHTML = partTransducerValue
    document.querySelector('#accTransducerActual').innerHTML = accTransducerValue

    // if (PlcInputs.WaterInletOn){
    //     document.querySelector('#waterInletButton').classList.remove('ind-off')
    //     document.querySelector('#waterInletButton').classList.add('ind-on')
    // }else{
    //     document.querySelector('#waterInletButton').classList.remove('ind-on')
    //     document.querySelector('#waterInletButton').classList.add('ind-off')
    // }

    updateBooleanElement('waterInletButton', PlcInputs.WaterInletOn)
    updateBooleanElement('autoButton', PlcInputs.Auto)
    updateBooleanElement('manualButton', PlcInputs.Manual)
    updateBooleanElement('startButton', PlcInputs.StartTestIndicator)
    updateBooleanElement('stopButton', PlcInputs.StopTestIndicator)
    updateBooleanElement('openDoorButton', PlcInputs.DoorOpen)
    updateBooleanElement('closeDoorButton', PlcInputs.DoorClosed)
    updateBooleanElement('resetButton', PlcInputs.ResetIndicator)

    updateIndicatorElement('autoIndicatorLED', PlcInputs.Auto)
    updateIndicatorElement('oilIndicatorLED', PlcInputs.OilLevelOk)
    updateIndicatorElement('hydraulicIndicatorLED', PlcInputs.HydraulicPumpOn)
    updateIndicatorElement('waterPressureIndicatorLED', PlcInputs.WaterPressureOk)
    updateIndicatorElement('waterLowLowIndicatorLED', PlcInputs.WaterTankNotLowLow)
    updateIndicatorElement('waterLowIndicatorLED', PlcInputs.WaterTankNotLow)
    updateIndicatorElement('doorClosedIndicatorLED', PlcInputs.DoorClosed)
    updateIndicatorElement('doorLOpenIndicatorLED', PlcInputs.DoorOpen)
    updateIndicatorElement('doorLockLeftIndicatorLED', PlcInputs.DoorLockLeft)
    updateIndicatorElement('doorLockRightIndicatorLED', PlcInputs.DoorLockRight)
    updateIndicatorElement('intensifierForwardIndicatorLED', PlcInputs.IntensifierFoward)
    updateIndicatorElement('intensifierRetractedIndicatorLED', PlcInputs.IntensifierRetracted)

}

const readGroup1 = async () => {
    await PLC.readTagGroup(group1);
 
    // log the values to the console
    group1.forEach(tag => {

        switch(tag.name){
            case 'hmiStandardTestSelected':
                standardTestSelected = tag.value
                break
            case 'hmiCycleTestSelected':
                cycleTestSelected = tag.value
                break
            case 'hmiDynamicTestSelected':
                dynamicTestSelected = tag.value
                break
            case 'hmiRampRate':
                CycleTest.RampRate = parseInt(tag.value)
                break
            case 'hmiCycleCount':
                CycleTest.CycleCount = parseInt(tag.value)
                break
            case 'hmiMinPressure':
                CycleTest.MinPressure = parseInt(tag.value)
                break
            case 'hmiMaxPressure':
                CycleTest.MaxPressure = parseInt(tag.value)
                break
            case 'hmiActualPartPressure':
                partTransducerValue = parseInt(tag.value)
                break
            case 'hmiActualAccumulatorPressure':
                accTransducerValue = parseInt(tag.value)
                break
            case 'hmiWaterInletIndicator':
                PlcInputs.WaterInletOn = tag.value
                break
            case 'hmiAutoIndicator':
                PlcInputs.Auto = tag.value
                break
            case 'hmiManualIndicator':
                PlcInputs.Manual = tag.value
                break
            case 'hmiStartIndicator':
                PlcInputs.StartTestIndicator = tag.value
                break
            case 'hmiStopIndicator':
                PlcInputs.StopTestIndicator = tag.value
                break
            case 'hmiResetIndicator':
                PlcInputs.ResetIndicator = tag.value
                break
            case 'hmiDoorOpenIndicator':
                PlcInputs.DoorOpen = tag.value
                break
            case 'hmiDoorCloseIndicator':
                PlcInputs.DoorClosed = tag.value
                break
            case 'hmiHydraulicPumpOn':
                PlcInputs.HydraulicPumpOn = tag.value
                break
            case 'hmiOilLevelOk':
                PlcInputs.OilLevelOk = tag.value
                break
            case 'hmiWaterPressureOk':
                PlcInputs.WaterPressureOk = tag.value
                break
            case 'hmiReturnTankLowLevelOK':
                PlcInputs.WaterTankNotLowLow = tag.value
                break
            case 'hmiReturnTankHighLevelOK':
                PlcInputs.WaterTankNotLow = tag.value
                break
            case 'hmiDoorClosed':
                PlcInputs.DoorClosed = tag.value
                break
            case 'hmiDoorOpen':
                PlcInputs.DoorOpen = tag.value
                break
            case 'hmiDoorLockLeftActive':
                PlcInputs.DoorLockLeft = tag.value
                break
            case 'hmiDoorLockRightActive':
                PlcInputs.DoorLockRight = tag.value
                break
            case 'hmiIntensifierForward':
                PlcInputs.IntensifierFoward = tag.value
                break
            case 'hmiIntensifierRetracted':
                PlcInputs.IntensifierRetracted = tag.value
                break

            default:
                break
        }

    });

    updateUI()
}


const SendButton = (name, val) => {
    if (isConnected)
        PLC.writeTag(name, val)
    else 
        console.log('plc not connected')
}

const writePlcValue = async (tag, value) => {
    if (isConnected){
        await PLC.writeTag(tag, value)
    }else{
        console.log('plc not connected')
    }
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

const displayFaultList = faults => {

    let alarmDiv = document.querySelector('.alarmScreen')

    faults.forEach(fault => {
        let div = document.createElement('div')
        div.classList.add('faultItem')
        div.innerHTML = fault

        alarmDiv.appendChild(div)
    })

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

document.getElementById('standardTestButton').addEventListener('mousedown', () => SendButton(standardTestPushbutton, true))
document.getElementById('standardTestButton').addEventListener('mouseup', () => SendButton(standardTestPushbutton, false))
document.getElementById('standardTestButton').addEventListener('mouseleave', () => SendButton(standardTestPushbutton, false))

document.getElementById('cycleTestButton').addEventListener('mousedown', () => SendButton(cycleTestPushbutton, true))
document.getElementById('cycleTestButton').addEventListener('mouseup', () => SendButton(cycleTestPushbutton, false))
document.getElementById('cycleTestButton').addEventListener('mouseleave', () => SendButton(cycleTestPushbutton, false))

document.getElementById('dynamicTestButton').addEventListener('mousedown', () => SendButton(dynamicTestPushbutton, true))
document.getElementById('dynamicTestButton').addEventListener('mouseup', () => SendButton(dynamicTestPushbutton, false))
document.getElementById('dynamicTestButton').addEventListener('mouseleave', () => SendButton(dynamicTestPushbutton, false))

// document.getElementById('writeSetupButton').addEventListener('click', writeSetupToPLC)

document.querySelector('#closeSetupPageButton').addEventListener('click', () => document.querySelector('.setupClass').classList.add('hidden'))
document.querySelector('#showSetup').addEventListener('click', () => document.querySelector('.setupClass').classList.remove('hidden'))

document.querySelector('#rampRateEnter').addEventListener('click', () => {
    let writeValue = parseInt(document.querySelector('#rampRate').value)
    writePlcValue(rampRateWrite, writeValue)
})

document.querySelector('#cycleCountEnter').addEventListener('click', () => {
    let writeValue = parseInt(document.querySelector('#cycleCount').value)
    writePlcValue(cycleCountWrite, writeValue)
})

document.querySelector('#minPressureEnter').addEventListener('click', () => {
    let writeValue = parseInt(document.querySelector('#minPressure').value)
    writePlcValue(minPressureWrite, writeValue)
})

document.querySelector('#maxPressureEnter').addEventListener('click', () => {
    let writeValue = parseInt(document.querySelector('#maxPressure').value)
    writePlcValue(maxPressureWrite, writeValue)
})

document.querySelector('#showStatus').addEventListener('click', () => document.querySelector('.statusScreen').classList.remove('hidden'))
document.querySelector('#closeStatusButton').addEventListener('click', () => document.querySelector('.statusScreen').classList.add('hidden'))


let testFultList = [
    'Fault Code 30 - Ths is fault 30',
    'fault Code 31 - This is fault 31',
    'fault code 32 = this is fualt 32'
]

displayFaultList(testFultList)




PLC.forEach(tag => {
    
    tag.on('Initialized', tag => {
        if (tag.name === 'CycleTestActive')
            CycleTestActive = tag.value

        
        console.log(tag.name)
        console.log(tag.value)
        console.log("test")

    })

    tag.on('Changed', (tag, oldValue) => {

        if (tag.name === 'CycleTest_CurrentPressureStorage'){
            console.log(tag.value.toFixed(2))
        }

        if (tag.name === 'CycleTestActive')
            CycleTestActive = tag.value

        // console.log(tag.value)

        console.log(`cycle test active = ${CycleTestActive}`)

        console.log(tag.value)

        // autoButton.value = !autoButton.value

    })

})