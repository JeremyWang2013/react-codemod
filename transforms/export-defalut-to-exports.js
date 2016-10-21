'use strict';

let exportDefaultClass = /\Wexport\s+default\s+(class\s+(\w+)[^\u0000]*)/;
let exportDefault = /(\W)export\s+default([\s{\[(]+)/;
let exportCount = /\Wexport[\s{\[(]+/gm;

module.exports = function (file, api) {
    let source = file.source;

    let count = (exportCount.exec(source) || []).length;
    if (count == 1) {
        if (exportDefaultClass.test(source)) {
            return source.replace(exportDefaultClass, `$1\nmodule.exports = $2;`)
        } else if (exportDefault.test(source)) {
            return source.replace(exportDefault, `$1module.exports =$2`)
        } else {
            console.warn(file.path, 'Has export by not default. You need manual modify.');
            return false;
        }
    } else if (count > 1) {
        console.warn(file.path, 'Has multi export. You need manual modify.')
    } else {
        return false;
    }

};
