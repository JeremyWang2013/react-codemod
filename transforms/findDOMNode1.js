/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

import {doImportReactDOM} from './utils/RegexUtil'

function getDOMNodeToFindDOMNode(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);
    const ReactUtils = require('./utils/ReactUtils')(j);
    require('./utils/array-polyfills');

    if (!ReactUtils.hasReact(root))
        return false;

    const createReactFindDOMNodeCall = arg => j.callExpression(
        j.memberExpression(
            j.identifier('ReactDOM'),
            j.identifier('findDOMNode'),
            false
        ),
        [arg]
    );

    const updateToFindDOMNode = classPath => {
        var sum = 0;
        sum += j(classPath)
            .find(j.CallExpression, {
                callee: {
                    property: {
                        type: 'Identifier',
                        name: 'getDOMNode',
                    },
                },
            })
            .forEach(path => {
                j(path).replaceWith(
                    createReactFindDOMNodeCall(path.value.callee.object)
                )
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

    if (didTransform) {
        return doImportReactDOM(root.toSource({quote: 'single'}));
    }

}

module.exports = getDOMNodeToFindDOMNode;
