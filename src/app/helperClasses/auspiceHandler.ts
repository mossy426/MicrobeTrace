import { CommonService } from '../contactTraceCommonServices/common.service';
import * as patristic from 'patristic';

export default function AuspiceHandler() {
   console.log('Initiated');
}

AuspiceHandler.recurseChildren = (tree) => {
  if (!tree.children) {
    const node = this.makeNode(tree);
    const branch = new patristic.Branch(node);
    return branch;
  } else {
    const newTree = new patristic.Branch({});
    for (const child of tree.children) {
      const node = this.recurseChildren(child);
      newTree.addChild(node);
    }
    return newTree;
  }
};

AuspiceHandler.makeNode = (tree) => {
  const node: any = {};
  node.id = tree.name;
  node.data = {};
  node.data.name = tree.name;
  for (const attribute of Object.keys(tree.node_attrs)) {
    if (attribute !== 'div') {
      node.data[attribute] = tree.node_attrs[attribute].value;
    } else {
      node.data[attribute] = tree.node_attrs[attribute];
    }
  }
  return node;
};


AuspiceHandler.parseAuspice = (auspiceTree) => {
  const rootObj = new patristic.Branch({});
  return recurseChildren(auspiceTree.tree);
};

