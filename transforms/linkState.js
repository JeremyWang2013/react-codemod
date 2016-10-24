'use strict';

import {hasLinkedStateMixin} from './utils/regexps'
const VALUE_LINK = "valueLink";
const LINK_TYPES = [
    VALUE_LINK,
    'checkedLink',
    "dateTimeLink",
];

const USE_EVENT_ELEMENTS = [
    "Input"
];
const BEST_INPUT = "BestInput";

function getDOMNodeToFindDOMNode(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);
    const ReactUtils = require('./utils/ReactUtils')(j);
    require('./utils/array-polyfills');

    if (!ReactUtils.hasReact(root))
        return false;

    const checkSupportArrowFunc = (path) => path.filter((classPath)=> j(classPath).find(j.ArrowFunctionExpression).size() > 0);
    const isSuportArrowFunctionExpression = (
            checkSupportArrowFunc(ReactUtils.findReactCreateClass(root)).size() +
            checkSupportArrowFunc(ReactUtils.findReactCreateClassModuleExports(root)).size() +
            checkSupportArrowFunc(ReactUtils.findReactCreateClassExportDefault(root)).size()
        ) > 0;

    const isObjectsProperty = (linkStateName)=> {
        let text = linkStateName.value;
        return linkStateName.type === 'Literal'
            && (typeof text === 'string')
            && /^\w/.test(text)
            && /^\D/.test(text)
    };

    const createThisState4LinkState = (thisExpression, linkStateName) => {
        let state = j.memberExpression(thisExpression, j.identifier('state'));

        if (isObjectsProperty(linkStateName)) {
            return j.memberExpression(state, j.identifier(linkStateName.value));
        } else {
            return j.memberExpression(state, linkStateName);
        }
    };

    const createOnChange4LinkState = (thisExpression, linkStateName, linkType, openingElement)=> {
        let arg1 = j.identifier('e');
        let newValue = createNewValue(openingElement, linkType, arg1);

        let body;
        let setState = j.memberExpression(thisExpression, j.identifier('setState'));

        if (isObjectsProperty(linkStateName)) {
            let prop = j.property('init', j.identifier(linkStateName.value), newValue);
            let param = j.objectExpression([prop]);
            body = j.callExpression(setState, [param]);

            if (!isSuportArrowFunctionExpression) {
                body = j.blockStatement([
                    j.expressionStatement(body)
                ])
            }
        } else {
            body = createOnChangeBlockStatement4ObjectValue(linkStateName, newValue, setState);
        }


        if (isSuportArrowFunctionExpression) {
            return j.arrowFunctionExpression([arg1], body);
        } else {
            return j.callExpression(
                j.memberExpression(
                    j.functionExpression(null, [arg1], body),
                    j.identifier("bind")),
                [j.thisExpression()]
            );
        }
    };

    const createNewValue = (openingElement, linkType, e)=> {
        let elementType = openingElement.name.name || openingElement.name.property.name;
        let attributes = openingElement.attributes;
        let typeAttr = attributes.find(attr=>attr.name.name === "type");

        let isBestInputAndBSInput = elementType === BEST_INPUT && !typeAttr;
        if (!isBestInputAndBSInput) {
            isBestInputAndBSInput = elementType === BEST_INPUT
                && typeAttr.value.type == 'Literal'
                && typeof  typeAttr.value.value == 'string';
        }

        if (
            elementType[0] === elementType.toLowerCase()[0] ||
            USE_EVENT_ELEMENTS.indexOf(elementType) > -1 ||
            isBestInputAndBSInput
        ) {
            // Native xxxLink
            let targetProps = linkType == VALUE_LINK ? "value" : "checked";
            return j.memberExpression(
                j.memberExpression(e, j.identifier('target')),
                j.identifier(targetProps))
        } else {
            // Custom xxxLink
            return e;
        }
    };

    const createOnChangeBlockStatement4ObjectValue = (linkStateName, newValue, setState)=> {
        return j.blockStatement([
            j.variableDeclaration(
                'let', [
                    j.variableDeclarator(j.identifier("newState"), j.objectExpression([])),
                ]
            ),
            j.expressionStatement(
                j.assignmentExpression(
                    '=',
                    j.memberExpression(
                        j.identifier("newState"),
                        linkStateName,
                        true
                    ),
                    newValue
                )
            ),
            j.expressionStatement(
                j.callExpression(setState, [j.identifier("newState")])
            ),
        ]);
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

    const updateLinkState = classPath => {
        if (hasLinkedStateMixin.test(j(classPath).toSource()))
            return false;

        var sum = 0;

        // <xxx xxxState={xxx.linkState("xxx")}/>
        sum += j(classPath)
            .find(j.JSXAttribute, {
                name: {
                    name: (name)=> LINK_TYPES.indexOf(name) > -1
                }
            })
            .forEach((path) => {
                let openingElement = path.parentPath.parentPath.value;
                let linkType = path.value.name.name;
                let attributes = openingElement.attributes;

                let info = findLinkStateInfo(path);
                if (!info)
                    return;

                let index = attributes.findIndex(attr=>attr.name.name === linkType);

                // value={}
                let jsxIdentifierValue = j.jsxIdentifier("value");
                let value = createThisState4LinkState(info.thisExpression, info.linkStateName);
                let jsxAttributeValue = j.jsxAttribute(jsxIdentifierValue, j.jsxExpressionContainer(value));
                jsxAttributeValue.comments = path.comments;
                j(path).replaceWith(jsxAttributeValue);

                // onChange={}
                let jsxIdentifierOnChange = j.jsxIdentifier("onChange");
                let onChange = createOnChange4LinkState(info.thisExpression, info.linkStateName, linkType, openingElement);
                let jsxAttributeOnChange = j.jsxAttribute(jsxIdentifierOnChange, j.jsxExpressionContainer(onChange));
                attributes.splice(index + 1, 0, jsxAttributeOnChange);
            })
            .size();

        return sum > 0;
    };

    const apply = (path) => path.filter(updateLinkState);

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
