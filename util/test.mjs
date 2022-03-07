/*
    HOW TO USE

    node test.mjs <path_to_test_files>

    This will load all .lox files in the directory provided and run them.
    Next, it will compare them to all .test files of the same name in that directory.
*/

import * as child_process from 'child_process'
import { argv } from 'process'
import * as fs from 'fs'

const runTest = (test) => {
    return new Promise((resolve, reject) => {
            child_process.exec(`npm.cmd run --silent lox ${ test[1] }`, (error, stdout, stderr) => {
            
            if (error) {
                reject(error)
            } else {
                const output = stdout.replaceAll('\r\n', '\n').trim().normalize()
                const expected = test[2].replaceAll('\r\n', '\n').trim().normalize()
                resolve([output === expected ? 'PASS' : output, output === expected])
            }
        })
    })
}

const main = () => {
    const path = argv[2]
    let tests = []

    fs.readdir(path, async (error, files) => {
        if (error)
            return console.log('Unable to scan directory' + error)
        
        files.forEach(fileName => {

            if (fileName.includes('.lox')) {

                const fileNameStriped = fileName.replace('.lox', '')
                const expectedFilePath = `${ path }/${fileNameStriped}.test`
                
                let data = ''
                try {
                    data = fs.readFileSync(`${ expectedFilePath }`, { encoding: 'utf8', flag: 'r' })

                    //Test name, path to test file, expected output
                    tests.push([fileNameStriped, `${ path }/${fileName}`, data])
                } catch (e) {
                    console.error(`Could not open file ${ expectedFilePath }`)
                }

            }
        })

        let passed = 0
        let failed = 0

        for (let i = 0; i < tests.length; i++) {
            console.log(`[${ i + 1 }/${ tests.length }] Running test ${ tests[i][0] }`)
            const result = await runTest(tests[i])

            if (result[1]) {
                passed++
                console.log('\x1b[0;32mPASS\x1b[0m')
            } else {
                failed++
                console.log('\x1b[0;31mFAIL\x1b[0m')

                console.log('\x1b[0;33mExpected:\n' + tests[i][2] + '\n')
                console.log('Got:\n' + result[0] + '\x1b[0m')
            }

            console.log('')
        }

        console.log(`\x1b[0;33m${ tests.length } tests run\x1b[0m`)
        console.log(`\x1b[0;32m${ passed } passed\x1b[0m, \x1b[0;31m${ failed } failed\x1b[0m \x1b[0;33m(${ (passed / tests.length * 100).toFixed(1) }%)\x1b[0m`)
    })
}

main()