import { CommonService } from '../contactTraceCommonServices/common.service';
import * as patristic from 'patristic';

export class AuspiceHandler {
    console.log('Initiated');

    constructor (commonService: CommonService) => {
        this.commonService = commonService;
    }

    public recurseChildren = (tree) => {
        if (!tree.children) {
            const node = this.makeNode(tree);
            this.commonService.session.data.push(node);
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

    public makeNode = (tree) => {
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


    public parseAuspice = (auspiceTree) => {
        const rootObj = new patristic.Branch({});
        return recurseChildren(auspiceTree.tree);
    };

    public strainSymbol = Symbol('strain');

    public treeToNewick = (tree, temporal, internalNodeNames=false, nodeAnnotation=() => "") => {
        const getXVal = temporal ? (n) => getTraitFromNode(n, "num_date") : getDivFromNode;

        function recurse(node, parentX) {
            if (!node.inView || tree.visibility[node.arrayIdx]!==NODE_VISIBLE) {
                return "";
            }
            if (node.hasChildren) {
                const childSubtrees = node.children.map((child) => {
                    const subtree = recurse(child, getXVal(node));
                    return subtree;
                });
                return `(${childSubtrees.filter((t) => !!t).join(",")})` +
                    `${internalNodeNames?node.name:""}${nodeAnnotation(node)}:${getXVal(node) - parentX}`;
            }
            /* terminal node */
            const leaf = `${node.name}${nodeAnnotation(node)}:${getXVal(node) - parentX}`;
            return leaf;
        }

        const rootNode = tree.nodes[tree.idxOfInViewRootNode];
        const rootXVal = getXVal(rootNode);
        return recurse(rootNode, rootXVal) + ";";
    };


    public getTraitFromNode = (node, trait, {entropy=false, confidence=false}={}) => {
        if (!node.node_attrs) return undefined;

        if (!entropy && !confidence) {
            if (!node.node_attrs[trait]) {
                if (trait === strainSymbol) return node.name;
                return undefined;
            }
            const value = node.node_attrs[trait].value;
            if (!this.isValueValid(value)) return undefined;
            return value;
        } else if (entropy) {
            if (node.node_attrs[trait]) return node.node_attrs[trait].entropy;
            return undefined;
        } else if (confidence) {
            if (node.node_attrs[trait]) return node.node_attrs[trait].confidence;
            return undefined;
        }
        return undefined;
    };

    public getDivFromNode = (node) => {
        /* see comment at top of this file */
        if (node.node_attrs && node.node_attrs.div !== undefined) {
            return node.node_attrs.div;
        }
        return undefined;
    };

    public isValueValid = (value) => {
        if (!["number", "boolean", "string"].includes(typeof value)) {
            return false;
        }
        if (typeof value === "string" && invalidStrings.includes(value.toLowerCase())) {
            return false; // checks against list of invalid strings
        }
        // booleans, valid strings & numbers are valid.
        return true;
    };

    public run = (jsonObj) => {
        const fullTree = this.AuspiceHandler.parseAuspice(jsonObj);
        const newickString =  this.treeToNewick(fullTree, true);
        console.log(newickString);
    }
        
}
