/*
 * Formsy.inputs 内容变动。本来为 {key1: input1 ...}，现变为 [input1, input2]
 *
 * 所以请全局搜索 .inputs 排查引用处
 * BestForm handleInvalidSubmit 接口需要修改为如下形式，可参考
 */

var BestForm = {
    handleInvalidSubmit(model, resetForm, invalidateForm){
        var inputs = this.refs.form.inputs,
            errorInputs = {};
        inputs.forEach(function (input) {
                let key = input.props.name;
                if (!input.isValid()) {
                    var val = input.getValue();
                    if (input.props.required && (val === undefined || val === null || val === '')) {
                        errorInputs[key] = typeof (input.props.validationError) == 'string' && input.props.validationError !== "" ? input.props.validationError : '请填写此字段';
                    }
                }
            }
        );
        invalidateForm(errorInputs);
    }
}