/* eslint-disable block-scoped-var */
/* eslint-disable vars-on-top */
/* eslint-disable no-undef */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */

'use-strict'

const path = require('path')
const solc = require('solc')
const fs = require('fs-extra')
// Functions

/**
 * Makes sure that the build folder is deleted, before every compilation
 * @returns {*} - Path where the compiled sources should be saved.
 */
//console.log('path test', __dirname);
// interfaces folder

exports.compilingPreperations = () => {
    const buildPath = path.resolve(__dirname, '../../build')
    // console.log('build path', buildPath)
    fs.removeSync(buildPath)
    return buildPath
}

exports.createConfiguration = () => ({
    language: 'Solidity',
    sources: {
        'MyToken.sol': {
            content: fs.readFileSync('contracts/MyToken.sol', 'utf8'),
            urls: [
                '@openzeppelin/contracts/security/ReentrancyGuard.sol',
                '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol',
                '@openzeppelin/contracts/access/Ownable.sol',
                '@openzeppelin/contracts/utils/Counters.sol',
            ],
        },
    },

    settings: {
        outputSelection: {
            '*': {
                '*': ['*'],
            },
        },
    },
})
exports.getImports = (dependency) => {
    console.log('Searching for dependency: ', dependency)
    switch (dependency) {
        case 'MyToken.sol':
            return {
                contents: fs.readFileSync(
                    path.resolve('contracts', 'MyToken.sol'),
                    'utf8'
                ),
            }
        /* case 'AnotherImportedSolidityFile.sol':
              return {contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'AnotherImportedSolidityFile.sol'), 'utf8')}; */
        default:
            return { error: 'File not found' }
    }
}
exports.findImport = (_path) => {
    if (_path[0] === '.') {
        return {
            contents: fs.readFileSync(path.join(__dirname, _path)).toString(),
        }
    }
    return {
        contents: fs
            .readFileSync(path.join(__dirname, '../../../node_modules', _path))
            .toString(),
    }
}
/**
 * Compiles the sources, defined in the config object with solc-js.
 * @param config - Configuration object.
 * @returns {any} - Object with compiled sources and errors object.
 */
exports.compileSources = (config) => {
    try {
        // console.log('config for sources', config);

        // return JSON.parse(
        //   solc.compile(JSON.stringify(config), { import: this.findImports })
        // );
        return JSON.parse(
            solc.compile(JSON.stringify(config), { import: this.findImport })
        )
    } catch (e) {
        console.log(e)
    }
}

/**
 * Searches for dependencies in the Solidity files (import statements). All import Solidity files
 * need to be declared here.
 * @param dependency
 * @returns {*}
 */

/**
 * Shows when there were errors during compilation.
 * @param compiledSources
 */
exports.errorHandling = (compiledSources) => {
    if (!compiledSources) {
        console.error(
            '>>>>>>>>>>>>>>>>>>>>>>>> ERRORS <<<<<<<<<<<<<<<<<<<<<<<<\n',
            'NO OUTPUT'
        )
    } else if (compiledSources.errors) {
        // something went wrong.
        console.error(
            '>>>>>>>>>>>>>>>>>>>>>>>> ERRORS <<<<<<<<<<<<<<<<<<<<<<<<\n'
        )
        compiledSources.errors.map((error) =>
            console.log(error.formattedMessage)
        )
    }
}

/**
 * Writes the contracts from the compiled sources into JSON files, which you will later be able to
 * use in combination with web3.
 * @param compiled - Object containing the compiled contracts.
 * @param buildPath - Path of the build folder.fdfsfds
 */
exports.writeOutput = (compiled, buildPath) => {
    // console.log('build', buildPath);
    fs.ensureDirSync(buildPath)
    // console.log('compilesd', compiled);
    // console.log('compilesd', compiled.contracts);

    // console.log(
    //   'compilesd my token',
    //   Object.values(compiled.contracts).fd(-1)
    // );
    let [contractnameMeta] = Object.values(compiled.contracts).slice(-1)
    // console.log('contractnameMeta', Object.values(compiled.contracts).slice(-1))
    const [contractName] = Object.keys(contractnameMeta)
    const { abi, evm } = Object.values(contractnameMeta)[0]
    const byteCodeData = evm.bytecode.object
    // const evm = Object.values(contractnameMeta)[2].bytecode.object;

    // console.log('evm', byteCodeData)
    const content = JSON.stringify(abi, null, 2)
    // console.log('content', content)
    // console.log('abi', abi, 'Contact Name:', contractName);
    // let [contractName] = Object.values(compiled.contracts).slice(0);
    // console.log('contractnameMeta', contractName);
    // const contractName = Object.values()[0];
    // console.log('contractName', contractName);
    // for (let contractFileName in compiled.contracts) {
    //   console.log('hy', contractFileName);
    //   const contractName = contractFileName.replace('.sol', '');
    //   console.log('contract name', contractName);
    //   console.log('Writing: ', `${contractName}.json`);
    const buildFile = path.resolve(buildPath, `${contractName}.json`)
    fs.writeFile(buildFile, content, (err) => {
        if (err) {
            console.error(err)
        }
    })
    return { abi, bytecode: byteCodeData, buildFile }
    // try {
    //   // fs.outputJsonSync(path.resolve(buildPath, `${contractName}.json`), abi);

    //   // return 1;
    // } catch (e) {
    //   console.log('error', e);
    // }

    // for (let contractName in compiled.contracts) {
    //   // code and ABI that are needed by web3
    //   console.log(
    //     `${contractName}: ${compiledContract.contracts[contractName].bytecode}`
    //   );
    //   // console.log(contractName + '; ' + JSON.parse(compiledContract.contracts[contractName].interface));

    //   let { bytecode } = compiled.contracts[contractName];
    //   console.log('bytecode');
    //   // eslint-disable-next-line vars-on-top
    //   // eslint-disable-next-line no-var
    //   // var abi = JSON.parse(compiled.contracts[contractName].interface);
    //   // console.log('abi', JSON.stringify(abi, undefined, 2));
    // }

    // console.log(JSON.stringify(abi, undefined, 2));
}
