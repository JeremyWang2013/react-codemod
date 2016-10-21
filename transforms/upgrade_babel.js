const ITEMS = [
    require('./export-defalut-to-exports'),
];

module.exports = function (file, api, options) {
    let hasChange = false;
    ITEMS.forEach(item=> {
        let result = item(file, api, options);
        if (result) {
            file.source = result;
            hasChange = true;
        }
    });
    return hasChange ? file.source : false;
};
