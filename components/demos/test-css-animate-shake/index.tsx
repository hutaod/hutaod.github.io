import React, { useState } from "react";
import cls from "classnames";
import { Shadow } from '../../utils/shadow'

function TestAnimatiom() {
    const [visivleType, setVisible] = useState(false);

    return (
        <Shadow mode="open">
            <link rel="stylesheet" href="/shadow-styles/test-animation.css" />
            <div>
                <button onClick={() => setVisible(true)}>
                显示有兼容性问题的弹窗（比较难重现问题）
                </button>
                <button onClick={() => setVisible(1)}>设置延迟，重现弹窗抖动问题</button>
                <button onClick={() => setVisible(2)}>默认隐藏 popup，解决弹窗抖动问题</button>
                {visivleType && (<div className="popup-wrapper">
                    <div
                        className={cls("popup",
                            visivleType === 1 && "popup-delay",
                            visivleType === 2 && "popup-postion-set"
                        )}
                    >
                        <h3>弹窗</h3>
                        <button onClick={() => setVisible(false)}>关闭弹窗</button>
                    </div>
                </div>)}
            </div>
        </Shadow>
    );
}

export default TestAnimatiom;