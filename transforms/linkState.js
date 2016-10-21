'use strict';

function getDOMNodeToFindDOMNode(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);
    const ReactUtils = require('./utils/ReactUtils')(j);
    require('./utils/array-polyfills');

    // console.log(JSON.stringify(root))

    if (!ReactUtils.hasReact(root))
        return false;

    const isObjectsProperty = (linkStateName)=> {
        let text = linkStateName.value;
        return linkStateName.type === 'Literal'
            && (typeof text === 'string')
            && /^\w/.test(text)
            && /^\D/.test(text)
    };

    const createThisState4LinkState = (thisExpression, linkStateName) => {
        // state.linkStateName
        let state = j.memberExpression(thisExpression, j.identifier('state'));

        if (isObjectsProperty(linkStateName)) {
            return j.memberExpression(state, j.identifier(linkStateName.value));
        } else {
            return j.memberExpression(state, linkStateName);
        }
    };

    const createOnChange4LinkState = (thisExpression, linkStateName)=> {
        // todo: 参数获得正确值
        let arg1 = j.identifier('event');

        let setState = j.memberExpression(thisExpression, j.identifier('setState'));
        let params = createOnChangeParams(linkStateName, arg1);
        let body = j.callExpression(setState, params);

        return j.arrowFunctionExpression([arg1], body);
    };

    const createOnChangeParams = (linkStateName, newValue)=> {
        let param;

        if (isObjectsProperty(linkStateName)) {
            let prop = j.property('init', j.identifier(linkStateName.value), newValue);
            param = j.objectExpression([prop]);
        } else {
            // todo: linkStateName is func
            j.variableDeclaration(
                'let', [
                    j.variableDeclarator(
                        j.identifier("newState"),
                        j.objectExpression([]) //todo: remove []
                    ),
                ]
            );

            return j.memberExpression(state, linkStateName);
        }

        return [param]
    };

    const findLinkStateInfo = (pathValue)=> {
        let result = null;

        j(pathValue).find(j.CallExpression, {
            callee: {
                property: {
                    type: 'Identifier',
                    name: 'linkState',
                },
            },
        }).forEach(path => {
            result = {
                thisExpression: path.value.callee.object,
                linkStateName: path.value.arguments[0]
            };
        });

        if (!result || !result.linkStateName)
            console.error("Can't find linkState Attribute!!!");

        return result
    };

    const updateToFindDOMNode = classPath => {
        var sum = 0;

        // <xxx linkState={this.linkValue("xxx")}/>
        sum += j(classPath)
            .find(j.JSXAttribute, {
                name: {
                    name: "valueLink"
                }
            })
            .forEach(path => {
                let openingElement = path.parentPath.parentPath.value;
                let openingElementType = openingElement.name.name;
                let attributes = openingElement.attributes;
                let index = -1;
                attributes.forEach((att, i)=> {
                    if (att.name.name === 'valueLink') {
                        index = i;
                    }
                });

                let info = findLinkStateInfo(path);
                if (!info)
                    return;

                // value={}
                let jsxIdentifierValue = j.jsxIdentifier("value");
                let value = createThisState4LinkState(info.thisExpression, info.linkStateName);
                let jsxAttributeValue = j.jsxAttribute(jsxIdentifierValue, j.jsxExpressionContainer(value));
                jsxAttributeValue.comments = path.comments;
                j(path).replaceWith(jsxAttributeValue);

                // onChange={}
                let jsxIdentifierOnChange = j.jsxIdentifier("onChange");
                let onChange = createOnChange4LinkState(info.thisExpression, info.linkStateName);
                // let jsxAttributeOnChange = j.jsxAttribute(jsxIdentifierOnChange, j.jsxExpressionContainer(onChange));
                // attributes.splice(index + 1, 0, jsxAttributeOnChange);
            })
            .size();

        return sum > 0;
    };

    const apply = (path) => path.filter(updateToFindDOMNode);

    const didTransform = (
            apply(ReactUtils.findReactCreateClass(root)).size() +
            apply(ReactUtils.findReactCreateClassModuleExports(root)).size() +
            apply(ReactUtils.findReactCreateClassExportDefault(root)).size()
        ) > 0;


    // return false;
    if (didTransform) {
        return root.toSource({quote: 'single'});
    }

}

module.exports = getDOMNodeToFindDOMNode;
