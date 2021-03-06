import * as RNGSModule from "./module";
export { BackgroundBlurEffectIOS, Lang } from "./module";
export var Errors;
(function (Errors) {
    // 参数解析错误
    Errors[Errors["PARAMETER_PARSE_FAILED"] = -1] = "PARAMETER_PARSE_FAILED";
    // 安卓 activity 已经销毁
    Errors[Errors["ANDROID_ACTIVITY_DESTROYED"] = -2] = "ANDROID_ACTIVITY_DESTROYED";
    // 重复运行
    Errors[Errors["DUPLICATE_START"] = -3] = "DUPLICATE_START";
})(Errors || (Errors = {}));
export var Events;
(function (Events) {
    // 验证结果
    Events[Events["RESULT"] = 1] = "RESULT";
    // 验证窗口关闭
    Events[Events["CLOSED"] = 2] = "CLOSED";
    // 验证失败
    Events[Events["FAILED"] = 3] = "FAILED";
    // 发生错误
    Events[Events["ERROR"] = 0] = "ERROR";
})(Events || (Events = {}));
var InternalStatus;
(function (InternalStatus) {
    InternalStatus[InternalStatus["None"] = 0] = "None";
    // 认证中
    InternalStatus[InternalStatus["Running"] = 1] = "Running";
    // 停止认证中
    InternalStatus[InternalStatus["Stoping"] = 0] = "Stoping";
})(InternalStatus || (InternalStatus = {}));
let internalStatus = InternalStatus.None;
let eventListener = null;
const DEFAULT_OPTION = {
    api1Result: "",
    debug: false,
    loadTimeout: 10000,
    reqTimeout: 10000,
    lang: RNGSModule.Lang.System,
    enableBackgroundCancel: false,
    backgroundColorIOS: 0,
    backgroundBlurEffectIOS: RNGSModule.BackgroundBlurEffectIOS.None,
};
// 进行行为认证
export function start(option) {
    return new Promise((resolve, reject) => {
        if (internalStatus & InternalStatus.Running) {
            return reject(new GeetestError(Errors.DUPLICATE_START, "Duplicate start"));
        }
        internalStatus |= InternalStatus.Running;
        eventListener = RNGSModule.addListener(([code, ...data]) => {
            switch (code) {
                case Events.RESULT:
                    resolve(JSON.parse(data[0]));
                    stop();
                    break;
                case Events.FAILED:
                case Events.CLOSED:
                    stop();
                    break;
                case Events.ERROR:
                    reject(new GeetestError(data[0], data[1]));
                    stop();
                    break;
            }
            if (typeof option.onEvent === "function") {
                option.onEvent(code, data);
            }
        });
        RNGSModule.start(RNGSModule.parseOption(option, DEFAULT_OPTION));
    });
}
function stop() {
    if (internalStatus & InternalStatus.Stoping) {
        return;
    }
    internalStatus |= InternalStatus.Stoping;
    RNGSModule.stop(() => {
        internalStatus = InternalStatus.None;
        if (eventListener && typeof eventListener.remove === "function") {
            eventListener.remove();
            eventListener = null;
        }
    });
}
export class GeetestError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.message = message;
        // @ts-ignore
        if (Error.captureStackTrace) {
            // @ts-ignore
            Error.captureStackTrace(this, GeetestError);
        }
        this.name = "GeetestError";
    }
}
