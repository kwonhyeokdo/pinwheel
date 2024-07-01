import * as VScode from 'vscode';
import * as Path from 'path';

export class PinwheelTreeItem extends VScode.TreeItem{
	children: PinwheelTreeItem[]|undefined;
	path: String|undefined;

	constructor(path: string, children?: PinwheelTreeItem[]){
		const label = Path.basename(path);
		super(label, children === undefined ? VScode.TreeItemCollapsibleState.None : VScode.TreeItemCollapsibleState.Expanded);
		this.children = children;
		this.path = path;
		this.contextValue = "pinwheelTreeItem";
		this.command = {
			command: 'vscode.open',
			title: 'Open Call',
			arguments: [
				VScode.Uri.file(path)
			]
		};
	}
}