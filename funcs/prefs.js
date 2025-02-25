/************************************
[rewrite_local]
^https?:\/\/spinat.org\/prefs url script-analyze-echo-response https://raw.githubusercontent.com/sxmkl/spinat/main/funcs/prefs.js

[mitm]
hostname = spinat.org
************************************/

const url = new URL($request.url);
const path = $request.path;
const body = $request.body;


let myResponse;

function createResponse(status = 200, data = {}) {
    const statusText = status === 200 ? "OK" : "Internal Server Error";

    return {
        status: `HTTP/1.1 ${status} ${statusText}`,
        headers: {
            "Date": new Date().toUTCString(),
            "Content-Type": "application/json,charset=UTF-8"
        },
        body: JSON.stringify(data, null, 2)
    };
}

switch (true) {
    case /get/.test(path):
        const keys = url.searchParams.get("keys")?.split(",") || [];
        const result = {};
        keys.forEach(key => {
            result[key] = $prefs.valueForKey(key);
        });
        myResponse = createResponse(200, result);
        break;

    case /set/.test(path):
        try {
            const obj = JSON.parse(body);
            const pairs = {...obj};

            // 设置键值对
            Object.entries(pairs).forEach(([key, value]) => {
                $prefs.setValueForKey(value, key);
            });

            myResponse = createResponse(200, {
                success: true,
                message: "键值对设置成功",
                pairs
            });
        } catch (error) {
            console.log("设置键值对失败" + error);

            myResponse = createResponse(200, {
                success: false,
                message: error.message
            });
        }
        break;
    case /edit/.test(path):
        const key = url.searchParams.get("key") || "";
        const css = `*{font-family:Courier,-apple-system,BlinkMacSystemFont,"SegoeUI",Roboto,sans-serif;}body{max-width:800px;margin:20pxauto;padding:020px;padding-bottom:80px;}input,textarea{font-family:inherit;}.input-group{margin:15px0;}.input-grouplabel{display:block;margin-bottom:8px;color:#333;font-weight:500;}#keyInput{width:90%;padding:10px;border:1pxsolid#ddd;border-radius:4px;font-size:13px;}#valueInput{width:90%;height:auto;padding:10px;border:1pxsolid#ddd;border-radius:4px;font-size:12px;line-height:1.2;resize:vertical;}.buttons{position:fixed;top:20px;right:20px;display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:8px;box-shadow:02px10pxrgba(0,0,0,0.1);z-index:100;touch-action:none;user-select:none;cursor:move;transition:transform0.1sease;}button{padding:6px12px;min-width:60px;border:none;border-radius:4px;background:rgba(0,123,255,0.78);color:white;font-size:13px;cursor:pointer;transition:all0.2sease;pointer-events:auto;}button:hover{opacity:0.9;}button:disabled{opacity:0.7;cursor:not-allowed;}.toast{visibility:hidden;min-width:50px;background-color:#333;color:#fff;text-align:center;border-radius:2px;padding:10px;position:fixed;z-index:1;left:50%;bottom:300px;transform:translateX(-50%);opacity:0;}.toast.show{visibility:visible;opacity:1;animation:fadein0.3s,fadeout0.5s1sforwards;}.toast.error{visibility:visible;opacity:1;animation:fadein0.3s,fadeout0.5s2sforwards;}@keyframes fadein{to{bottom:300px;opacity:1;visibility:visible;}}@keyframes fadeout{from{bottom:300px;opacity:1;}to{bottom:250px;opacity:0;visibility:hidden;}}`
        const htmlContent =
        `
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
		<title>编辑键值对</title>
		<style>
			${css}
		</style>
	</head>
	<body>
		<h2>编辑键值对</h2>
		<div class="input-group">
			<label for="keyInput">键名:</label>
			<input type="text" id="keyInput" value="${key}" placeholder="输入键名..." />
		</div>
		<div class="input-group">
			<label for="valueInput">值:</label>
			<textarea id="valueInput" placeholder="输入值..." spellcheck="false"></textarea>
		</div>
		<div class="buttons">
			<button id="loadBtn" onclick="loadData()">Load</button>
			<button id="saveBtn" onclick="saveData()">Save</button>
		</div>
		<div id="toast" class="toast"></div>

		<script>
			${htmlFuncs.toString()}
		</script>
	</body>
</html>`;

        myResponse = {
            status: "HTTP/1.1 200 OK",
            headers: {
                "Date": new Date().toUTCString(),
                "Content-Type": "text/html",
            },
            body: htmlContent
        };
        break;
}

$done(myResponse);


function htmlFuncs() {
    // 工具函数
    let valueType;
    let toastTimeout;
    function setLoading(isLoading) {
        document.getElementById("loadBtn").disabled = isLoading;
        document.getElementById("saveBtn").disabled = isLoading;
    }

    function showToast(message, isError = false) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.className = "toast show" + (isError ? " error" : "");
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }
        toastTimeout = setTimeout(() => {
            toast.className = toast.className.replace("show", "");
        }, 1500);
    }

    // 页面加载逻辑
    document.addEventListener("DOMContentLoaded", () => {
        const keyInput = document.getElementById("keyInput");
        const valueInput = document.getElementById("valueInput");

        // 自动调整高度的函数
        function autoResize() {
            this.style.height = "auto";
            this.style.height = this.scrollHeight + "px";
        }

        // 为valueInput添加事件监听
        valueInput.addEventListener("input", autoResize);

        // 在内容加载后也调整一次高度
        valueInput.addEventListener("change", autoResize);

        keyInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                loadData();
            }
        });

        if (keyInput.value) {
            loadData();
        }
    });

    // 数据操作函数
    async function loadData() {
        const key = document.getElementById("keyInput").value.trim();
        if (!key) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/prefs/get?keys=" + encodeURIComponent(key));
            const data = await response.json();
            const value = data[key];

            let displayValue = value || "";
            // 尝试解析JSON字符串
            try {
                const parsedValue = JSON.parse(value);
                if (typeof parsedValue === "object") {
                    displayValue = JSON.stringify(parsedValue, null, 2);
                    valueType = "object";
                }
            } catch (e) {
                // 如果解析失败，说明不是JSON字符串，直接显示原值
                displayValue = value;
            }

            document.getElementById("valueInput").value = displayValue;
            // 手动触发 input 事件以执行 autoResize
            document.getElementById("valueInput").dispatchEvent(new Event("input"));
        } catch (error) {
            showToast("Load failed: " + error.message, true);
        } finally {
            setLoading(false);
        }
    }

    async function saveData() {
        const key = document.getElementById("keyInput").value.trim();
        let value = document.getElementById("valueInput").value;

        if (!key) {
            showToast("请输入键名", true);
            return;
        }

        // 尝试格式化JSON
        let isValidJson = false;
        try {
            const parsed = JSON.parse(value);
            if (typeof parsed === "object") {
                value = JSON.stringify(parsed); // 压缩为单行
            }
        } catch (e) {
            // 输入像是 JSON
            const potentialJson = value.trim();
            if ((potentialJson.startsWith("{") || potentialJson.endsWith("}")) || (potentialJson.startsWith("[") || potentialJson.endsWith("]"))) {
                // 但格式不正确
                if (!confirm("JSON 格式似乎不正确，是否仍要保存？\\n\\n错误信息：" + e.message)) {
                    return;
                }
            }
            // 如果不是 JSON 格式，使用原始值
        }

        setLoading(true);
        try {
            const response = await fetch("/prefs/set", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({[key]: value}),
            });
            const result = await response.json();

            if (result.success) {
                showToast("Save success");
            } else {
                showToast("Save failed: " + JSON.stringify(result), true);
            }
        } catch (error) {
            showToast("Save failed: " + error.message, true);
        } finally {
            setLoading(false);
        }
    }
}
