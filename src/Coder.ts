const _ = require('lodash')

const getBit = (byte: number, index: number): number => (byte >> (7 - index)) & 1
const setBit = (byte: number, index: number, val: number): number => {
    let shift = 7 - index
    byte &= ~(7 << shift)
    byte |= val << shift
    return byte
}
const swapBit = (byte: number, index: number) => {
    let shift = 7 - index
    let val = Number(!getBit(byte, index))
    byte &= ~(7 << shift)
    byte |= val << shift
    return byte
}

// let swapBits = (bits, index1, index2) => {
//     let shift1 = (15n - index1) * 4n,
//         shift2 = (15n - index2) * 4n
//     let bit1 = (bits >> shift1) & 15n,
//         bit2 = (bits >> shift2) & 15n
//     let swap = bit1 ^ bit2
//     swap = (swap << shift1) | (swap << shift2)
//     return bits ^ swap
// }

// const randomBoardbits = moves => {
//     let bits = BigInt('0x123456789abcdef0'),
//         zero = 15,
//         next = null,
//         prev = null
//     for (let i = 0; i < moves; ++i) {
//         next = getNeighbours(zero, prev)
//         next = next[(Math.random() * next.length) | 0]
//         bits = swapbits(bits, BigInt(zero), BigInt(next))
//         prev = zero
//         zero = next
//     }
//     return [bits, zero]
// }

const coding_table: any = {
    '0000': '00000000',
    '0001': '00011011',
    '0010': '00110101',
    '0011': '00101110',
    '0100': '01101001',
    '0101': '01110010',
    '0110': '01011100',
    '0111': '01000111',
    '1000': '11010001',
    '1001': '11001010',
    '1010': '11100100',
    '1011': '11111111',
    '1100': '10111000',
    '1101': '10100011',
    '1110': '10001101',
    '1111': '10010110'
}
const code = (data: Buffer): Buffer => {
    let result: number[] = []
    for (const byte of data) {
        let binary = byte.toString(2).padStart(8, '0')
        let [left, right]: [string, string] = [binary.slice(0, 4), binary.slice(4, 8)]
        let [left_n, right_n]: [number, number] = [parseInt(coding_table[left], 2), parseInt(coding_table[right], 2)]
        result.push(left_n, right_n)
    }
    return Buffer.from(new Uint8Array(result).buffer)
}

let decoding_table: any = {
    '00000000': '0000',
    '00011011': '0001',
    '00110101': '0010',
    '00101110': '0011',
    '01101001': '0100',
    '01110010': '0101',
    '01011100': '0110',
    '01000111': '0111',
    '11010001': '1000',
    '11001010': '1001',
    '11100100': '1010',
    '11111111': '1011',
    '10111000': '1100',
    '10100011': '1101',
    '10001101': '1110',
    '10010110': '1111'
}
let parity_matrix: number[][] = [
    [0, 0, 1, 0, 1, 1, 1, 0],
    [0, 1, 0, 1, 1, 1, 0, 0],
    [1, 0, 1, 1, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1]
]

const parity = (byte_str: string): number => [...byte_str].reduce((sum, val) => sum + Number(val == '1'), 0) % 2
const MatrixProd = (A: number[][], B: number[][]) => A.map((row, i) => B[0].map((_, j) => row.reduce((acc, _, n) => acc + A[i][n] * B[n][j], 0)))
const replaceBit = (s: string, i: number, c: string): string => s.substring(0, i) + c + s.substring(i + 1)

let errors = 0
const decode = (data: Buffer): Buffer => {
    let result = []
    errors = 0
    nextByte: for (const byte of data) {
        let byte_str = byte.toString(2).padStart(8, '0')
        if (byte_str in decoding_table) {
            result.push(parseInt(decoding_table[byte_str], 2))
            continue nextByte
        }
        if (parity(byte_str) == 0) {
            errors++
            result.push(0)
            continue nextByte
        }

        let col_data = [...byte_str].map(val => [Number(val)])
        let col_err = MatrixProd(parity_matrix, col_data).reduce((a: any, val: any) => a + (val % 2).toString(), '')
        for (let i = 0; i < parity_matrix[0].length; i++) {
            let col = parity_matrix.map(row => String(row[i])).reduce((s, c) => s + c, '')

            if (col == col_err) {
                byte_str = replaceBit(byte_str, i, byte_str[i] == '1' ? '0' : '1')
                if (byte_str in decoding_table) {
                    result.push(parseInt(decoding_table[byte_str], 2))
                } else result.push(0)
                continue nextByte
            }
        }
        console.log('SHOULD NOT HAPPEN')
        result.push(0)
    }

    console.log('> Errors: ', errors)
    return Buffer.from(new Uint8Array(_.chunk(result, 2).map((val: number[]) => (val[0] << 4) + val[1])).buffer)
}

const noise = (data: Buffer, prob: number): Buffer => {
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < 8; j++) {
            if (Math.random() < prob) {
                data[i] = swapBit(data[i], j)
            }
        }
    }
    return data
}

const compare = (data: Buffer, dataCompare: Buffer) => {
    let [errors, places]: [number, number[]] = [0, []]
    for (let i = 0; i < data.length; i++) {
        if ((data[i] & 15) != (dataCompare[i] & 15)) errors++
        if (((data[i] >> 4) & 15) != ((dataCompare[i] >> 4) & 15)) errors++
        for (let j = 0; j < 8; j++) {
            if (((data[i] >> j) & 1) ^ ((dataCompare[i] >> j) & 1)) places.push(i * 8 + j)
        }
    }
    console.log('> Number of changed blocks found: ', errors)
    console.log('> Positions: ', places)
}

export const execute = (data: Buffer, mode: string, prob?: number, dataCompare?: Buffer, bit?: number, val?: boolean): Buffer => {
    switch (mode) {
        case 'koder':
            return code(data)
        case 'szum':
            return noise(data, prob)
        case 'dekoder':
            return decode(data)
        case 'sprawdz':
            compare(data, dataCompare)
            return data
        case 'get':
            break
        case 'set':
            break
        case 'swap':
            break
        default:
            console.log('ERROR')
            return data
    }
}

// // PARSING
// console.time('Parsing time')
// let data_vecs: Vector3[] = _.map(_.chunk(tgaData, 4), (chunk: number[]) => _.mapKeys(_.dropRight(chunk), getKey))
// console.timeEnd('Parsing time')

// // STARTING CENTROIDS
// console.time('Sampling time')
// // let centroids = _.sampleSize(_.uniqWith(data_vecs, eq), 2 ** colors) // V1 - THIS HAS VERY BAD OPTIMIZATION

// let centroids: Vector3[] = []
// let set = _.uniqWith(data_vecs, eq)
// assert(set.length > 2 ** colors, 'OOPS - number of colors on image is less than or equal to ', _.uniqWith(data_vecs, eq).length, ' <= ', 2 ** colors, ' chosen number of divisions - so image wont change')
// if (set.length <= 2 ** colors) return tgaData
// else {
//     for (let i = 0; i < 2 ** colors; i++) {
//         let rand: Vector3, alreadyTaken
//         do {
//             rand = data_vecs[Math.floor(Math.random() * data_vecs.length)]
//             alreadyTaken = centroids.some(val => eq(rand, val))
//         } while (alreadyTaken)
//         centroids.push(rand)
//     }
//     // V2 - THIS IS BETTER BUT FOR BIG NUMBER OF CENTROIDS AND NOT SO DIFFERENT COLORS IS GETTING STUCK SO I ADDED CHECK
// }
// console.timeEnd('Sampling time')

// // CALCULATION
// console.time('Quantization time')
// let result = LindeBuzoGray(centroids, data_vecs, epsilon, Infinity)
// console.timeEnd('Quantization time')

// let mse = _.reduce(result, (sum: number, centroid: RGBVals, vec: number) => sum + Math.pow(d(centroid, data_vecs[vec]), 2), 0) / data_vecs.length
// let snr = _.reduce(result, (sum: number, centroid: RGBVals, vec: number) => sum + Math.pow(centroid.r + centroid.g + centroid.b, 2), 0) / data_vecs.length
// snr = 10 * Math.log10(snr / mse)

// console.log('> MSE: ', Math.sqrt(mse))
// console.log('> SNR: ', snr)

// // PARSING BACK
// let result_buffer = new Uint8Array(_.flatten(_.map(result, (val: RGBVals) => [...Object.values(val), 255])))
// return result_buffer
