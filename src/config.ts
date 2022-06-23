export default class CONFIG {
    static IN_FILE_NAME_PROPERTIES = [
        {
            name: 'inputName',
            description: 'Enter input file name',
            type: 'string'
        }
    ]
    static OUT_FILE_NAME_PROPERTIES = [
        {
            name: 'outputName',
            description: 'Enter output file name',
            type: 'string'
        }
    ]
    static COMP_FILE_NAME_PROPERTIES = [
        {
            name: 'compName',
            description: 'Enter name of file to compare',
            type: 'string'
        }
    ]

    static OPERATION_PROPERTIES = [
        {
            name: 'operation',
            description: 'Enter operation name',
            validator: /^((q)|(set)|(get)|(swap)|(in)|(out)|(koder)|(dekoder)|(szum)|(sprawdz))$/,
            warning: 'Must be either q, in, out, set, get, swap, koder, szum, dekoder or sprawdz'
        }
    ]
    static NOISE_PROPERTIES = [
        {
            name: 'noise',
            description: 'Enter noise [0;1]',
            type: 'number'
        }
    ]
    static BIT_PROPERTIES = [
        {
            name: 'bit',
            description: 'Enter bit position',
            type: 'number'
        }
    ]
    static VAL_PROPERTIES = [
        {
            name: 'val',
            description: 'Enter set {0/1}',
            type: 'number'
        }
    ]
}
