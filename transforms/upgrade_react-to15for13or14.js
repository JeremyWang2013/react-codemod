const ITEMS = [
    require('./upgrade_react-to14for13'),
    require('./linkState'),
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
