const { Controller, Tag, EthernetIP } = require('ethernet-ip')
const { DINT, BOOL } = EthernetIP.CIP.DataTypes.Types

const PLC = new Controller()

let isConnected = false
let myValue = 0.0
let CycleTestActive = false

const startButton = new Tag('hmiStartButton', null, BOOL)
const ackTag = new Tag('CycleTestValueReadyForStorage_Ack', null, BOOL)
const resultTagReady = new Tag('CycleTestValueReadyForStorage')
const resultTag = new Tag('CycleTest_CurrentPressureStorage')

PLC.subscribe(new Tag('CycleTest_CurrentPressureStorage'))
PLC.subscribe(new Tag('CycleTestActive'))



document.getElementById('autoButton').addEventListener('mousedown', () => {
    if (isConnected)
        PLC.writeTag(startButton, true)
})

document.getElementById('autoButton').addEventListener('mouseup', () => {
    if (isConnected)
        PLC.writeTag(startButton, false)
})

document.getElementById('autoButton').addEventListener('mouseleave', () => {
    if (isConnected)
        PLC.writeTag(startButton, false)
})

let testArr = []

document.getElementById('testButton').addEventListener('click', () =>{

    
})



PLC.connect('10.1.10.198', 0).then(()=>{
    isConnected = true
    PLC.scan_rate =50
    PLC.scan()
})


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