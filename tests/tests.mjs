import * as child_process from 'child_process'

let general_tests = [
    ['General', 'test'],
    ['(5 + 3) * (4 - 2) / (3 - 1)', '8'],
    ['15 * 3 + 4 * 5', '65'],
    ['-"apple"', '[Runtime][Line 1] Operand must be a number. - apple'],
    ['!"apple"', '[Runtime][Line 1] Operand must be a number. ! apple'],
]

let rpn_tests = [
    ['RPN', 'rpn no-output test'],
    ['1 + 2 + 3', '1 2 + 3 +'],
    ['1 + 2 * 3', '1 2 3 * +'],
    ['1 + 2 * 3 + 4', '1 2 3 * + 4 +'],
    ['1 + 2 * 3 + 4 * 5', '1 2 3 * + 4 5 * +'],
]

let ternary_tests = [
    ['Ternary', 'test'],
    ['1 ? 2 : 3', '1 2 3 ? :'],
    ['1 ? 2 : 3 ? 4 : 5', '1 2 3 ? 4 5 ? :'],
    ['1 ? 2 : 3 ? 4 : 5 ? 6 : 7', '1 2 3 ? 4 5 ? 6 7 ? :'],
    ['1 ? 2 : 3 ? 4 : 5 ? 6 : 7 ? 8 : 9', '1 2 3 ? 4 5 ? 6 7 ? 8 9 ? :'],
]

let string_comparison = [
    ['String Comparison', 'test'],
    ['"apple" == "apple"', 'true'],
    ['"apple" == "orange"', 'false'],
    ['"apple" != "orange"', 'true'],
    ['"apple" != "apple"', 'false'],
    ['"apple" < "orange"', 'true'],
    ['"apple" < "apple"', 'false'],
    ['"apple" > "orange"', 'false'],
    ['"apple" > "apple"', 'false'],
    ['"apple" <= "orange"', 'true'],
    ['"apple" <= "apple"', 'true'],
    ['"apple" >= "orange"', 'false'],
    ['"apple" >= "apple"', 'true'],
]

const runTests = async (tests) => {
    return new Promise(resolve => {
        let args = ['run', '--silent', 'lox']
        tests[0][1] !== '' && args.push(tests[0][1])
        const interpreter = child_process.spawn('npm.cmd', args);

        let passed = 0
        let failed = 0

        let testId = 1
        interpreter.stdout.on('data', (data) => {
            const output = data.toString()
            const testInput = tests[testId][0]
            const expected = tests[testId][1]

            if (output.includes(expected)) {
                console.log(`PASS ${testInput}`)
                passed++
            } else {
                console.log(`FAIL ${testInput}\tExpected: ${expected}\n\tActual: ${output}`)
                console.log(`\tExpected: ${expected}\n\tActual: ${output}`)
                failed++
            }

            testId++
            if (testId < tests.length) {
                runTest()
            } else {
                interpreter.kill()
                testId = 1
                resolve([passed, failed])
            }
        })

        const runTest = () => {
            const testData = tests[testId][0]
            interpreter.stdin.write(testData + '\n')
        }

        interpreter.stderr.setEncoding('utf8')
        interpreter.stderr.on('data', (data) => console.error(data.toString()) )

        interpreter.stdin.setDefaultEncoding('utf8')
        runTest()
    })
}

const main = async () => {
    let testCategories = [
        general_tests,
        rpn_tests,
        ternary_tests,
        string_comparison
    ]

    let passed = 0
    let failed = 0

    for (const testCat of testCategories) {
        console.log(`Running ${testCat[0][0]} tests`)
        
        await runTests(testCat).then(res => {
            console.log(`${result[0]} passed, ${result[1]} failed`)
            passed += result[0]
            failed += result[1]
        })
    }

    console.log(`Totals: ${passed} passed, ${failed} failed`)

    if (failed === 0)
        console.log('All tests passed!')

    process.exit(0)
}

main()