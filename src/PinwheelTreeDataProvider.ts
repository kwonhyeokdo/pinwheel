import { PinwheelTreeItem } from "./PinWheelTreeItem";
import * as VScode from 'vscode';

export class PinwheelTreeDataProvider implements VScode.TreeDataProvider<PinwheelTreeItem>{
	onDidChangeTreeData?: VScode.Event<PinwheelTreeItem | null | undefined> | undefined;
	data: PinwheelTreeItem[];

	constructor(pinwheelTreeItem:PinwheelTreeItem[]){
		this.data = pinwheelTreeItem;
	}

	getTreeItem(element: VScode.TreeItem): VScode.TreeItem | Thenable<VScode.TreeItem> {
		return element;
	}

	getChildren(element?: PinwheelTreeItem | undefined): VScode.ProviderResult<PinwheelTreeItem[]> {
		if(element === undefined){
			return this.data;
		}
		return element.children;
	}
}