'use strict';

import {importReactOrReactDOM} from './utils/regexps'

let renderToBody = /((?:React|ReactDOM)\.render\s*\([^\u0000]*\Wdocument\.)body(\W*\))/g;

module.exports = function (file, api) {
    let source = file.source;
    return importReactOrReactDOM.test(source) && renderToBody.test(source)
        ? source.replace(renderToBody, `$1getElementById("container")$2`)
        : false;
};
