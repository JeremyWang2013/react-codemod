'use strict';

let useReactSelect = /((?:require|import).*['"])react-select((?:\/[^'"]+)?['"])/g;

module.exports = function (file, api) {
    let source = file.source;
    return useReactSelect.test(source)
        ? source.replace(useReactSelect, `$1@best/react-select$2`)
        : false;
};
