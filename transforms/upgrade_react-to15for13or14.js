const ITEMS = [
    require('./react-to-react-dom1'),
    require('./react-to-react-addons'),
    require('./linkState'),
    require('./findDOMNode1'),
    require('./document-body-to-container'),
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
