module.exports = {
    importReactOrReactDOM: /(require|import).*['"](react(\/addons)?|react-dom)['"].*/i,
    importReact: /(require|import).*['"]react(\/addons)?['"].*/i,
    importReactDOM: /(require|import).*['"]react-dom['"].*/i,
    isSupportImport: /import.*['"][^'"]+['"]/i,
}