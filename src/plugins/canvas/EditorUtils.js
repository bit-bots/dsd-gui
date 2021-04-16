import Node from '../../entities/Node';

export default class EditorUtils{
    static uuidv1() {
        return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
            // eslint-disable-next-line prefer-const
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    static getRelativePointerPosition(node) {
        // the function will return pointer position relative to the passed node
        const transform = node.getAbsoluteTransform().copy();
        // to detect relative position we need to invert transform
        transform.invert();

        // get pointer (say mouse or touch) position
        const pos = node.getStage().getPointerPosition();

        // now we find a relative point
        return transform.point(pos);
    }
    static castNode(node, forSnapshot){
        let nodeToCast = node;
        if(node.hasName('periode') || (node.parent && node.parent.hasName('periode'))){
            nodeToCast = EditorUtils.getTopLevelNode(node);
        }
        return EditorUtils.getNode(nodeToCast, forSnapshot);
    }
    static getNode(node, forSnapshot){
        if(!node) return;
        let periode = undefined;
        if(node.findOne('Group') && node.findOne('Group').findOne('Group')){
            periode = this.getNode(node.findOne('Group').findOne('Group'), forSnapshot);
        }
        const customItem = JSON.parse(JSON.stringify(node.getAttr('customItem')));
        if(forSnapshot){
            customItem.containingFile = undefined;
        }
        return new Node(customItem, node.getAttr('customAttr'), node.id().split('$')[1], node.position(), periode);
    }
    static getTopLevelNode(node){
        let loopVar = node;
        while (loopVar.parent && loopVar.parent.hasName('periode')){
            loopVar = loopVar.parent;
        }
        return loopVar;
    }
}