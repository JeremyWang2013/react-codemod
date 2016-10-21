import {importReact, importReactDOM} from './regexps'

module.exports = {
    doImportReactDOM(source){
        // import ReactDOM
        if (!importReactDOM.test(source)) {
            let isImport = importReact.exec(source)[1] == 'import';
            let text = isImport
                ? "$&\nimport ReactDOM from 'react-dom'"
                : "$&\nvar ReactDOM = require('react-dom');";
            return source.replace(importReact, text)
        } else {
            return source;
        }
    }
};