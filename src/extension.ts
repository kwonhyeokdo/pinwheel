import * as vscode from 'vscode';
import { PinwheelTreeItem } from './PinWheelTreeItem';
import { PinwheelTreeDataProvider } from './PinwheelTreeDataProvider';
import * as fs from 'fs';

const refreshDir = ()=>{
	const pinwheelPath = vscode.workspace.workspaceFolders?.at(0)?.uri.fsPath + "/___pinwheel";

	if(!fs.existsSync(pinwheelPath)){
		fs.mkdirSync(pinwheelPath);
	}

	const dirNames = ["list"];

	for(const dirName of dirNames){
		const path = `${pinwheelPath}/${dirName}`;
		if(!fs.existsSync(path)){
			fs.mkdirSync(path);
		}

		fs.readdir(path, (error, fileNames)=>{
			const pinwheelTreeItem = fileNames.map((fileName)=>{
				return new PinwheelTreeItem(`${path}/${fileName}`);
			});
			vscode.window.registerTreeDataProvider(`pinwheel_${dirName}`, new PinwheelTreeDataProvider(pinwheelTreeItem));
		});
	}
};

const registCommand = (context: vscode.ExtensionContext)=>{
	vscode.commands.registerCommand("pinwheel.refreshEntry", ()=>{
		refreshDir();
	});

	vscode.commands.registerCommand("pinwheel.runEntry", (treeItem)=>{
		// 1. 내용 추출
		const content = fs.readFileSync(treeItem.path).toString();
		
		// 2. GPT API
		const workspaceUri = vscode.workspace.workspaceFolders?.at(0)?.uri;
		if(!workspaceUri){
			return;
		}
		const workspacePath = workspaceUri.fsPath;
		const groupId = fs.readdirSync(`${workspacePath}/src/main/java`)[0].toString();
		const artifactId = fs.readdirSync(`${workspacePath}/src/main/java/${groupId}`)[0].toString();
		const javaPath = `${workspacePath}/src/main/java/${groupId}/${artifactId}`;
		const xmlPath = `${workspacePath}/src/main/resources/mapper/${groupId}/${artifactId}`;

		// gpt response sample
		const javaTestSmaplePath = `${javaPath}/test`;
		const xmlTestSmaplePath = `${xmlPath}/test`;
		const testController = fs.readFileSync(`${javaTestSmaplePath}/TestController.java`).toString();
		const testService = fs.readFileSync(`${javaTestSmaplePath}/TestService.java`).toString();
		const testServiceImpl = fs.readFileSync(`${javaTestSmaplePath}/TestServiceImpl.java`).toString();
		const testRepository = fs.readFileSync(`${javaTestSmaplePath}/TestRepository.java`).toString();
		const testVO = fs.readFileSync(`${javaTestSmaplePath}/TestVO.java`).toString();
		const testMapper = fs.readFileSync(`${xmlTestSmaplePath}/TestMapper.xml`).toString();
		const response = {
			"controller": {
				"title": "test2Controller.java",
				// "text": testController
				"text": "package com.example.demo.controller;\n\n// Generated using GPT\nimport com.example.demo.service.UasGtsdatService;\nimport com.example.demo.vo.UasGtsdat;\nimport lombok.RequiredArgsConstructor;\nimport org.springframework.http.ResponseEntity;\nimport org.springframework.web.bind.annotation.*;\n\nimport java.util.List;\n\n@RestController\n@RequiredArgsConstructor\npublic class UasGtsdatController {\n    private final UasGtsdatService uasGtsdatService;\n\n    @GetMapping(\"/uasgtsdat\")\n    public ResponseEntity<List<UasGtsdat>> retrieveUasGtsdat() {\n        // Generated using GPT\n        return ResponseEntity.ok(uasGtsdatService.retrieveUasGtsdat());\n    }\n\n    @PostMapping(\"/uasgtsdat\")\n    public ResponseEntity<Integer> insertUasGtsdat(@RequestBody UasGtsdat uasGtsdat) {\n        // Generated using GPT\n        return ResponseEntity.ok(uasGtsdatService.insertUasGtsdat(uasGtsdat));\n    }\n\n    @PutMapping(\"/uasgtsdat\")\n    public ResponseEntity<Integer> updateUasGtsdat(@RequestBody UasGtsdat uasGtsdat) {\n        // Generated using GPT\n        return ResponseEntity.ok(uasGtsdatService.updateUasGtsdat(uasGtsdat));\n    }\n\n    @DeleteMapping(\"/uasgtsdat\")\n    public ResponseEntity<Integer> deleteUasGtsdat(@RequestParam String key2) {\n        // Generated using GPT\n        return ResponseEntity.ok(uasGtsdatService.deleteUasGtsdat(key2));\n    }\n}\n"
			},
			"service": {
				"title": "test2Service.java",
				"text": testService
			},
			"serviceImpl": {
				"title": "test2ServiceImpl.java",
				"text": testServiceImpl
			},
			"repository": {
				"title": "test2Repository.java",
				"text": testRepository
			},
			"model": {
				"title": "test2Model.java",
				"text": testVO
			},
			"xml": {
				"title": "test2Xml.xml",
				"text": testMapper
			}
		};

		// 3. view
		const panel = vscode.window.createWebviewPanel(
			"testWebviewPanel", "testWebView", vscode.ViewColumn.One,{
				enableScripts: true,
				enableFindWidget: true
			}
		);

		const path = vscode.Uri.joinPath(context.extensionUri, "src", "WebviewContent.html");

		vscode.workspace.fs.readFile(path).then((uInt8Array)=>{
			const text = new TextDecoder().decode(uInt8Array)
				.replace("#{controllerTitle}", response.controller.title)
				.replace("#{controllerText}", response.controller.text)
				.replace("#{serviceTitle}", response.service.title)
				.replace("#{serviceText}", response.service.text)
				.replace("#{serviceImplTitle}", response.serviceImpl.title)
				.replace("#{serviceImplText}", response.serviceImpl.text)
				.replace("#{repositoryTitle}", response.repository.title)
				.replace("#{repositoryText}", response.repository.text)
				.replace("#{modelTitle}", response.model.title)
				.replace("#{modelText}", response.model.text)
				.replace("#{xmlTitle}", response.xml.title)
				.replace("#{xmlText}", response.xml.text)
				.replace("#{artifactId}", artifactId || "")
			;
			panel.webview.html = text;

			panel.webview.onDidReceiveMessage(
				message => {
					switch(message.command){
						case "create":
							const packagePath = message.text;
							const msgArr = [];
							for (const [layer, {title, text}] of Object.entries(response)) {
								const dirPath = (layer === "xml") ? `${xmlPath}/${packagePath}` : `${javaPath}/${packagePath}/${layer}`;
								const path = `${dirPath}/${title}`;

								if(fs.existsSync(path)){
									msgArr.push({
										code: "error",
										msg: `Failed to create "${title}" file.`
									});
								}else{
									if(!fs.existsSync(dirPath)){
										fs.mkdirSync(dirPath);
									}
									fs.writeFileSync(path, text);
									msgArr.push({
										code: "success",
										msg: `Successful creation of "${title}" file.`
									});
								}
							}
							for(const {code, msg} of msgArr){
								if(code === "error"){
									vscode.window.showErrorMessage(msg);
								}else{
									vscode.window.showInformationMessage(msg);
								}
							}
							return;
						case "requiredPackagePath":
							vscode.window.showErrorMessage(message.text);
							return;
						default:
							return;
					}
				}
			);
		});
	});
};

export function activate(context: vscode.ExtensionContext) {
	registCommand(context);
	vscode.commands.executeCommand("pinwheel.refreshEntry");
}

export function deactivate() {}