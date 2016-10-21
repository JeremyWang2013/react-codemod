'use strict';

import {importReact} from './utils/regexps'
import {doImportReactDOM} from './utils/RegexUtil'

const needReplaceMethod = ["render", "unmountComponentAtNode", "findDOMNode"];

module.exports = function (file, api) {
    let source = file.source;
    if (!importReact.test(source))
        return false;

    let hasChange = false;
    needReplaceMethod.forEach(key=> {
        let reg = new RegExp(`(\\W)React\\.${key}(\\W)`, 'g');
        if (reg.test(source)) {
            source = source.replace(reg, `$1ReactDOM.${key}$2`);
            hasChange = true;
        }
    });

    // import ReactDOM
    return hasChange ? doImportReactDOM(source) : false;
};
