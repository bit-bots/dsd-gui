export default class RestructurePlugin {
    constructor(stage, layer) {
        this._stage = stage;
        this._layer = layer;
    }

    restructure(entryNode, connections){
        this._connections = connections;
        const element = this.findElementByNode(entryNode);
        this.setNewElementPosition(element, {x:10,y:20});
    }

    setNewElementPosition(element, corrdiantes){
        let height = 0;
        element.position(corrdiantes)
        const outputnames = element.find('.' + 'output').toArray().map(output => output.id())
        if(outputnames){
            for(let i = 0;  i < outputnames.length; i++){
                const followingElement = this.getFollowingElement(element, outputnames[i]);
                if(followingElement){
                    const response = this.setNewElementPosition(followingElement, {x: corrdiantes.x + element.width() + 100, y: corrdiantes.y + height + (i > 0 ? 20 : 0)});
                    height += response;
                }
            }
        }
        return Math.max(height, element.height() + 20);
    }

    findElementByNode(node){
        return this._layer.findOne('#' + node.customItem.uuid + '$' + node.uuid1);
    }
    getFollowingElement(element, outputname){
        const connectionFromOutput = this._connections.filter(connection =>  connection.fromId === element.id() && outputname === connection.outputname);
        if(connectionFromOutput && connectionFromOutput.length > 0){
            return connectionFromOutput[0].to;
        }
        return undefined;
    }
}