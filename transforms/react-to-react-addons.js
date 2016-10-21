'use strict';

let useReactAddons = /((?:require|import).*)['"]react['"]([^\u0000]*React\.addons)/g;

module.exports = function (file, api) {
    let source = file.source;
    return useReactAddons.test(source)
        ? source.replace(useReactAddons, `$1"react/addons"$2`)
        : false;
};
