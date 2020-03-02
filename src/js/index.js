const fs = require('fs');
const path = require('path');
const mineType = require('mime-types');  // 文件类型
const folderPath = document.getElementById('fileInput');
let root;
const submitBtn = document.querySelector('.submitBtn');
const resultDom = document.querySelector('.resultArea');
// 这会打印出磁盘根级别的所有文件
// 同时包含'/'和'C:\'
const defaultPath = localStorage.getItem('readPath');
if (defaultPath) {
	folderPath.value = defaultPath;
}
// 上传路径
const uploadUrl = 'http://192.168.66.209:8280/knowledgeInter/web/upload/base64';
// 处理文件
let resultUrl = [];
let arr = [];
const handleReadEvent = () => {
	const allUpload = [];
	resultUrl = [];
	arr = [];
	if (folderPath && folderPath.value) {
		// 判断是否是文件夹
		try {
			const inputPathInfo = fs.statSync(folderPath.value);
			if (inputPathInfo.isFile()) {
				alert("当前路径不是文件夹，请输入文件夹路径");
				return;
			}
		} catch (error) {
			resultDom.getElementsByTagName('tbody')[0].innerHTML = `<tr><td class="textCenter error" colspan="7">${error}</td></tr>`;
		}
		try {
			root = fs.readdirSync(folderPath.value);
			localStorage.setItem('readPath', folderPath.value);
			console.log(root);
			let str = '';
			if (root && root.length) {
				root.forEach(m => {
					const obj = {
						name: m,
						path: folderPath.value + '/' + m,
						size: 0,
						status: 0,
						date: '',
						isFile: false,
						base64Url: '',
						fileUrl: '',
					}
					arr.push(obj);
					try {
						const fileInfo = fs.statSync(obj.path);
						let data = fs.readFileSync(obj.path);
						data = Buffer.from(data).toString('base64');
						obj.base64Url = 'data:' + mineType.lookup(obj.path) + ';base64,' + data;
						obj.size = fileInfo.size ? Math.round(fileInfo.size / 1024) + " KB" : 0;
						obj.date = fileInfo.birthtime ? new Date(fileInfo.birthtime).format('yyyy-MM-dd hh:mm:ss') : '';
						obj.isFile = fileInfo.isFile();
						// uploadFile(obj.base64Url);
						// const file = getMultiplePartFile(obj.base64Url);
						allUpload.push({
							name: obj.name,
							base64Url: obj.base64Url
						});
					} catch (error) { }
					// str += `<div class="resultArea_item" path="${folderPath.value}/${m}">${m}</div>`
				});
				// 排序
				arr.sort(function (a, b) {
					return new Date(b.date).getTime() - new Date(a.date).getTime();
				})
				arr.forEach((n, i) => {
					const fileTd = n.isFile ? `<td class="textCenter handleFilePreview" path="${n.path}">点击预览</td>` : `<td class="textCenter">--</td>`
					str += `<tr>
          <td class="textCenter">${i + 1}</td>
          <td>${n.name}</td>
          <td>${n.date}</td>
          <td>${n.path}</td>
          <td class="textCenter">${n.isFile ? n.size : '--'}</td>
          <td class="textCenter">${n.isFile ? (n.status == 0 ? "未上传" : "已上传") : '--'}</td>
          ${fileTd}
          </tr>`
				});

				// 统一上传
				handleAllFileUpload(allUpload);
			}
			resultDom.getElementsByTagName('tbody')[0].innerHTML = str;
		} catch (error) {
			resultDom.getElementsByTagName('tbody')[0].innerHTML = `<tr><td class="textCenter error" colspan="7">${error}</td></tr>`;
		}
	}
};
// 点击确认
submitBtn.addEventListener('click', handleReadEvent);
document.addEventListener("DOMContentLoaded", function () {
	handleReadEvent();
	handleAllEvent();
});

// 定时
setInterval(() => {
	handleReadEvent();
}, 60 * 1000);

// 所有点击事件
function handleAllEvent() {
	// 点击预览
	document.querySelector('.resultArea').addEventListener('click', (e) => {
		const target = e.target;
		if (target.classList.contains('handleFilePreview')) {
			const path = target.getAttribute('path');
			window.open(path);
		}
	});
}

// 统一处理文件上传
function handleAllFileUpload(allUpload) {
	if (!allUpload) return;
	for (let index = 0; index < allUpload.length; index++) {
		const element = allUpload[index];
		uploadFile(element.base64Url, element.name, allUpload.length);
	}
}

// 图片上传
async function uploadFile(base64Url, name, length) {
	const file = getMultiplePartFile(base64Url);
	const formData = new FormData();
	formData.append('file', file);
	const responseData = await fetch("http://111.200.244.194:28083/upload/file", {
		method: "POST",
		body: formData
	}).then(res => res.json());
	if (responseData) {
		resultUrl.push({
			name: name,
			url: responseData.url
		});
		if (resultUrl.length == length) {
			// console.log(resultUrl);
			refreshStatus(resultUrl);
		}
	}
}

// 重新
function refreshStatus(resultUrl) {
	resultUrl.forEach(n => {
		const findArrIndex = arr.findIndex(m => m.name == n.name);
		if (!isNaN(findArrIndex)) {
			arr[findArrIndex].status = 1;
			arr[findArrIndex].fileUrl = n.url;
		}
	});
	let str = '';
	arr.forEach((n, i) => {
		const fileTd = n.isFile ? `<td class="textCenter handleFilePreview" path="${n.path}">点击预览</td>` : `<td class="textCenter">--</td>`
		str += `<tr>
		<td class="textCenter">${i + 1}</td>
		<td>${n.name}</td>
		<td>${n.date}</td>
		<td>${n.path}</td>
		<td class="textCenter">${n.isFile ? n.size : '--'}</td>
		<td class="textCenter">${n.isFile ? (n.status == 0 ? "未上传" : "已上传") : '--'}</td>
		${fileTd}
		</tr>`
	});
	resultDom.getElementsByTagName('tbody')[0].innerHTML = str;
}