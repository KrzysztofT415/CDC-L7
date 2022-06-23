const { readFile } = require('fs/promises')
const myPrompt = require('prompt')
const chalk = require('chalk')

import CONFIG from './config'
import { writeToFile } from './utils'
import * as Coder from './Coder'

//
;(async () => {
    // SINGLE EXECUTION
    if (process.argv.slice(2).length > 0) {
        let [mode, inputName, outputName, prob] = process.argv.slice(2)
        let data = await readFile(inputName)
        if (mode == 'sprawdz') {
            let data2 = await readFile(outputName)
            Coder.execute(data, mode, Number(prob), data2)
            return
        }
        let processedData = Coder.execute(data, mode, Number(prob)) // EXEC
        if (outputName !== undefined) writeToFile(outputName, processedData)
        return
    }

    myPrompt.start()
    let current_buffer: Buffer

    readingInput: while (true) {
        if (!current_buffer) {
            var { inputName } = await myPrompt.get(CONFIG.IN_FILE_NAME_PROPERTIES)
            if (inputName === '') return
            try {
                current_buffer = await readFile(inputName)
                console.log('Buffer changed := ', current_buffer)
            } catch (exc) {
                console.log(exc, 'File not found')
                continue readingInput
            }
        }

        let { operation } = await myPrompt.get(CONFIG.OPERATION_PROPERTIES)
        let [noise_v, comp_file_v, bit_v, val_v]: [number, Buffer, number, boolean] = [null, null, null, null]

        switch (operation) {
            case 'in':
                current_buffer = null
                continue readingInput
            case 'out':
                let { outputName } = await myPrompt.get(CONFIG.OUT_FILE_NAME_PROPERTIES)
                writeToFile(outputName, current_buffer)
                continue readingInput
            case 'szum':
                let { noise } = await myPrompt.get(CONFIG.NOISE_PROPERTIES)
                noise_v = noise
                break
            case 'sprawdz':
                let { compName } = await myPrompt.get(CONFIG.COMP_FILE_NAME_PROPERTIES)
                try {
                    comp_file_v = await readFile(compName)
                } catch (exc) {
                    console.log(exc, 'File not found')
                    continue readingInput
                }
                break
            case 'dekoder':
            case 'koder':
                break
            case 'set':
                let { val } = await myPrompt.get(CONFIG.VAL_PROPERTIES)
                val_v = val
            case 'get':
            case 'swap':
                let { bit } = await myPrompt.get(CONFIG.BIT_PROPERTIES)
                bit_v = bit
            case 'q':
                return
            default:
                continue readingInput
        }

        // EXECUTION
        current_buffer = Coder.execute(current_buffer, operation, noise_v, comp_file_v, bit_v, val_v)
        console.log('Buffer changed := ', current_buffer)
    }
})()
