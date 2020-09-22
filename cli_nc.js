#!/usr/bin/env node

let templateData = []
const parentDirectory = process.cwd()
const fs = require('fs')

const getFiles = () => {
    let templateFiles = []
    // grab all the files from the current directory
    fs.readdir(`${parentDirectory}/templates`, (err, files) => {
        if (err) throw err
        // filter out any hidden files
        files.forEach((file, i) => {
            // filter out hidden files
            if (file.substr(0, 1) !== '.') {
                templateFiles.push(file);
            }
            // when all files are added build the templates
            if ((files.length - 1) === i) {
                buildTemplates(templateFiles)
            }
        });
    });
}

const buildTemplates = (templateFiles) => {

    const makeTemplateData = (tempName, tempData, complete) => {
        const templateDataObj = {
            name: tempName,
            data: tempData
        }
        templateData.push(templateDataObj)
        if (complete) {
            // the data for the files and location is gathered
            getUserInputs()
        }
    }

    const getTemplate = (tempName, complete) => {
        fs.readFile(`templates/${tempName}`, (err, data) => {
            if (err) throw err
            makeTemplateData(tempName, data.toString(), complete)
        })
    }

    templateFiles.forEach((templateFile, i) => {
        getTemplate(templateFile, (templateFiles.length - 1) === i)
    })
}

const getUserInputs = () => {
    // getting the user input for naming
    const readline = require("readline")
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.question("Where is the component located? EG: loans-dashboard\n", function(location) {
        rl.question("What is the components name?\n", function(name) {
            console.log(`${name}, will be a component of ${location}`)
            replaceTemplateStringVars(name, location)
            rl.close()
        })
    })

    rl.on("close", function() {
        process.exit(0)
    })
}

const replaceTemplateStringVars = (name, location) => {
    // dynamically naming all the files for the package
    templateData.forEach((template, i) => {
        const replaceVarsInData = template.data.split('COMP_NAME').join(name).split('FOLDER_LOCATION').join(location)
        template.data = replaceVarsInData
    })
    buildSrcFolder(name, location)
}

const buildSrcFolder = (name, location) => {
    if (!fs.existsSync(name)){
        fs.mkdirSync(name)

        try {
            process.chdir(`${name}`)
        } catch (err) {
            console.error(`chdir: ${err}`)
            return
        }
    } else {
        console.log(`${name} is already a component of ${location}, please`);
        return
    }

    buildSrcFiles(name, location)
}

const buildSrcFiles = (name, location) => {

    templateData.forEach(template => {
        // return to parent folder on each loop
        try {
            process.chdir(`${parentDirectory}/${name}`)
        } catch (err) {
            console.error(`chdir: ${err}`)
            return
        }
        
        // if the file needs to be in a sub folder
        if (template.name.substr(0, 1) === '_') {
            // get the name of the sub folder and make a folder if needed
            const subFolder = template.name.split(/[_]/)[1]
            if (!fs.existsSync(subFolder)){
                fs.mkdirSync(subFolder)
            }

            try {
                process.chdir(`${subFolder}`)
                const fileName = template.name.split(/[_]/)[2].replace('comp', name)
                fs.writeFileSync(`${fileName}`, template.data, function (err) {
                    if (err) throw err
                })
            } catch (err) {
                console.error(`chdir: ${err}`)
                return
            }

        } else {
            fs.writeFileSync(`${template.name}`, template.data, function (err) {
                if (err) throw err
            })
        }
    })
}

getFiles()
